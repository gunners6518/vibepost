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

  return { ok: true }
})
