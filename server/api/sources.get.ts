export default defineEventHandler(async (event) => {
  const supabase = getSupabaseAdmin(event)

  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: error.message }
    })
  }

  return {
    ok: true,
    data: data || []
  }
})
