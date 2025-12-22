export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate required fields
  if (!body.name || !body.rss_url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: 'name and rss_url are required' }
    })
  }

  const supabase = getSupabaseAdmin(event)

  const { data, error } = await supabase
    .from('sources')
    .insert({
      name: body.name,
      rss_url: body.rss_url
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: error.message }
    })
  }

  return {
    ok: true,
    data: data
  }
})
