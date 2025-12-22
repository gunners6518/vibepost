export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: 'Source ID is required' }
    })
  }

  const supabase = getSupabaseAdmin(event)

  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: error.message }
    })
  }

  return {
    ok: true
  }
})
