import Parser from 'rss-parser'
import { calculateScore, buildPreferenceDictionary } from '~/server/utils/scoring'

export default defineEventHandler(async (event) => {
  const supabase = getSupabaseAdmin(event)

  // Get enabled sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('id, name, rss_url')
    .eq('is_enabled', true)

  if (sourcesError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: sourcesError.message }
    })
  }

  if (!sources || sources.length === 0) {
    return {
      ok: true,
      inserted: 0
    }
  }

  const parser = new Parser()
  let totalInserted = 0

  // Get preference dictionary from recent actions for scoring
  // First, get recent actions
  const { data: recentActions, error: actionsError } = await supabase
    .from('item_actions')
    .select('item_id, action')
    .order('created_at', { ascending: false })
    .limit(200)

  let preferenceDict = new Map<string, number>()
  
  if (recentActions && recentActions.length > 0) {
    // Get item details for these actions
    const itemIds = recentActions.map(a => a.item_id)
    const { data: itemsData } = await supabase
      .from('items')
      .select('id, title, content_snippet')
      .in('id', itemIds)

    // Map items by id for quick lookup
    const itemsMap = new Map((itemsData || []).map(item => [item.id, item]))

    // Build actions with item data
    const actionsForScoring = recentActions
      .map(action => ({
        item_id: action.item_id,
        action: action.action,
        item: itemsMap.get(action.item_id)
      }))
      .filter(action => action.item) // Only include actions with item data

    preferenceDict = buildPreferenceDictionary(actionsForScoring)
  }

  // Process each source
  for (const source of sources) {
    try {
      // Fetch and parse RSS feed
      const feed = await parser.parseURL(source.rss_url)

      if (!feed.items || feed.items.length === 0) {
        continue
      }

      // Prepare items for insertion
      const itemsToInsert = feed.items
        .map((item) => {
          // Parse published date
          let publishedAt: string | null = null
          if (item.pubDate) {
            publishedAt = new Date(item.pubDate).toISOString()
          } else if (item.isoDate) {
            publishedAt = item.isoDate
          }

          // Extract content snippet
          let contentSnippet: string | null = null
          if (item.contentSnippet) {
            contentSnippet = item.contentSnippet
          } else if (item.content) {
            // Strip HTML tags for snippet
            contentSnippet = item.content.replace(/<[^>]*>/g, '').substring(0, 500)
          } else if (item.summary) {
            contentSnippet = item.summary
          }

          return {
            source_id: source.id,
            title: item.title || '',
            link: item.link || '',
            published_at: publishedAt,
            content_snippet: contentSnippet
          }
        })
        .filter((item) => item.link) // Only include items with links

      if (itemsToInsert.length === 0) {
        continue
      }

      // Insert items one by one to handle duplicates gracefully
      // (Supabase insert fails entirely if any item violates unique constraint)
      for (const item of itemsToInsert) {
        // Calculate score before insertion
        const score = calculateScore(item, preferenceDict)
        
        const { data, error } = await supabase
          .from('items')
          .insert({
            ...item,
            score
          })
          .select()
          .single()

        if (error) {
          // Ignore unique constraint violations (duplicate links)
          if (error.code !== '23505') {
            console.error(`Error inserting item from ${source.name}:`, error.message)
          }
        } else if (data) {
          totalInserted++
        }
      }
    } catch (err: any) {
      // Log error but continue with other sources
      console.error(`Error fetching RSS from ${source.name} (${source.rss_url}):`, err.message)
      continue
    }
  }

  return {
    ok: true,
    inserted: totalInserted
  }
})
