export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Parse query parameters
  const status = Array.isArray(query.status) ? query.status[0] : query.status
  const page = parseInt(Array.isArray(query.page) ? query.page[0] : query.page || '1', 10)
  const pageSize = Math.min(
    parseInt(Array.isArray(query.pageSize) ? query.pageSize[0] : query.pageSize || '20', 10),
    50
  )
  const sort = Array.isArray(query.sort) ? query.sort[0] : query.sort || 'published_at'

  // Validate status if provided
  const validStatuses = ['new', 'drafted', 'favorite', 'skipped']
  if (status && !validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid status',
      data: { error: `Status must be one of: ${validStatuses.join(', ')}` }
    })
  }

  // Validate sort
  const validSorts = ['score', 'published_at']
  if (sort && !validSorts.includes(sort)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid sort',
      data: { error: `Sort must be one of: ${validSorts.join(', ')}` }
    })
  }

  // Validate page
  if (page < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid page',
      data: { error: 'Page must be greater than 0' }
    })
  }

  // Get Supabase admin client
  const supabase = getSupabaseAdmin(event)

  // Build query
  let supabaseQuery = supabase
    .from('items')
    .select('*')

  // Apply status filter if provided
  if (status) {
    supabaseQuery = supabaseQuery.eq('status', status)
  }

  // Apply sorting
  const sortOrder = sort === 'score' ? 'desc' : 'desc' // Both default to desc
  supabaseQuery = supabaseQuery.order(sort, { ascending: false })

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  supabaseQuery = supabaseQuery.range(from, to)

  // Execute query
  const { data, error } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { error: error.message }
    })
  }

  return {
    ok: true,
    data: data || [],
    page,
    pageSize
  }
})
