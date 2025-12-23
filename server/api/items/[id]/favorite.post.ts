export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID is required',
      data: { error: 'Missing item ID' }
    })
  }

  const supabase = getSupabaseAdmin(event)

  // Update item status to 'favorite'
  const { error } = await supabase
    .from('items')
    .update({ status: 'favorite' })
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: error.message }
    })
  }

  // Log action to item_actions for preference learning
  try {
    const { error: actionError } = await supabase
      .from('item_actions')
      .insert({
        item_id: id,
        action: 'read_later'
      })
    
    if (actionError) {
      // Log but don't fail if action logging fails
      console.error('[Favorite API] Failed to log action:', actionError)
    }
  } catch (err) {
    // Log but don't fail if action logging fails
    console.error('[Favorite API] Failed to log action:', err)
  }

  // Recalculate score for this item based on updated preferences
  await recalculateItemScore(supabase, id)

  return { ok: true }
})

// Helper function to recalculate item score
async function recalculateItemScore(supabase: any, itemId: string) {
  try {
    const { calculateScore, buildPreferenceDictionary } = await import('~/server/utils/scoring')
    
    // Get preference dictionary from recent actions
    const { data: recentActions } = await supabase
      .from('item_actions')
      .select('item_id, action')
      .order('created_at', { ascending: false })
      .limit(200)

    let preferenceDict = new Map<string, number>()
    
    if (recentActions && recentActions.length > 0) {
      const itemIds = recentActions.map(a => a.item_id)
      const { data: itemsData } = await supabase
        .from('items')
        .select('id, title, content_snippet')
        .in('id', itemIds)

      const itemsMap = new Map((itemsData || []).map(item => [item.id, item]))
      const actionsForScoring = recentActions
        .map(action => ({
          item_id: action.item_id,
          action: action.action,
          item: itemsMap.get(action.item_id)
        }))
        .filter(action => action.item)

      preferenceDict = buildPreferenceDictionary(actionsForScoring)
    }

    // Get item to rescore
    const { data: itemData } = await supabase
      .from('items')
      .select('title, content_snippet, published_at, tags')
      .eq('id', itemId)
      .single()

    if (itemData) {
      const newScore = calculateScore(itemData, preferenceDict)
      await supabase
        .from('items')
        .update({ score: newScore })
        .eq('id', itemId)
    }
  } catch (err) {
    // Log but don't fail if score recalculation fails
    console.error('[Favorite API] Failed to recalculate score:', err)
  }
}
