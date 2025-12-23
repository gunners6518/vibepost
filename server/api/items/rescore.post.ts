/**
 * Rescore API - Recalculate scores for existing items
 * Uses CRON_SECRET for authentication (optional but recommended)
 */
import { calculateScore, buildPreferenceDictionary } from '~/server/utils/scoring'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabase = getSupabaseAdmin(event)

  // Optional: Check for secret authentication
  const secret = getHeader(event, 'x-secret') || getQuery(event).secret
  if (config.cronSecret && secret !== config.cronSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { error: 'Invalid secret' }
    })
  }

  // Get limit from query (default: 500)
  const query = getQuery(event)
  const limit = parseInt(
    Array.isArray(query.limit) ? query.limit[0] : query.limit || '500',
    10
  )

  console.log(`[Rescore API] Starting rescore for up to ${limit} items`)

  // Get preference dictionary from recent actions
  // First, get recent actions
  const { data: recentActions } = await supabase
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

  console.log(`[Rescore API] Built preference dictionary with ${preferenceDict.size} keywords`)

  // Get items to rescore (recent items first)
  const { data: items, error: fetchError } = await supabase
    .from('items')
    .select('id, title, content_snippet, published_at, tags')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (fetchError) {
    console.error('[Rescore API] Failed to fetch items:', fetchError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: fetchError.message }
    })
  }

  if (!items || items.length === 0) {
    return {
      ok: true,
      rescored: 0,
      message: 'No items to rescore'
    }
  }

  console.log(`[Rescore API] Found ${items.length} items to rescore`)

  // Rescore each item
  let rescored = 0
  let errors = 0

  for (const item of items) {
    try {
      const newScore = calculateScore(item, preferenceDict)

      const { error: updateError } = await supabase
        .from('items')
        .update({ 
          score: newScore,
          preference_version: 1 // Update preference version to track rescore
        })
        .eq('id', item.id)

      if (updateError) {
        console.error(`[Rescore API] Failed to update item ${item.id}:`, updateError)
        errors++
      } else {
        rescored++
      }
    } catch (err: any) {
      console.error(`[Rescore API] Error processing item ${item.id}:`, err)
      errors++
    }
  }

  console.log(`[Rescore API] Completed: ${rescored} rescored, ${errors} errors`)

  return {
    ok: true,
    rescored,
    errors,
    total: items.length
  }
})

