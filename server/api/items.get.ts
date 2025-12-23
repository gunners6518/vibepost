export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Parse query parameters
  const status = Array.isArray(query.status) ? query.status[0] : query.status
  const page = parseInt(Array.isArray(query.page) ? query.page[0] : query.page || '1', 10)
  const pageSize = Math.min(
    parseInt(Array.isArray(query.pageSize) ? query.pageSize[0] : query.pageSize || '20', 10),
    50
  )
  const sort = Array.isArray(query.sort) ? query.sort[0] : query.sort || 'score'
  const showLowScore = query.showLowScore === 'true' || query.showLowScore === true

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

  try {
    // First, try a simple query to check if table exists and get column info
    console.log('[items.get.ts] Testing table access...')
    const { data: testData, error: testError } = await supabase
      .from('items')
      .select('id, status, published_at')
      .limit(1)
    
    if (testError) {
      console.error('[items.get.ts] Test query error:', testError)
      // If test query fails, the error might give us clues about missing columns
    } else {
      console.log('[items.get.ts] Test query successful. Sample data:', testData)
    }
    console.log('[items.get.ts] Building query with params:', { status, sort, page, pageSize })
    
    // Build query
    let supabaseQuery = supabase
      .from('items')
      .select('*')

    // Apply status filter if provided
    if (status) {
      console.log('[items.get.ts] Applying status filter:', status)
      supabaseQuery = supabaseQuery.eq('status', status)
    }

    // Apply score filter (default: only show score >= 60)
    if (!showLowScore) {
      console.log('[items.get.ts] Applying score filter: >= 60')
      supabaseQuery = supabaseQuery.gte('score', 60)
    }

    // Apply sorting
    // Note: Supabase orders NULLs last by default for DESC order
    console.log('[items.get.ts] Applying sort:', sort)
    supabaseQuery = supabaseQuery.order(sort, { ascending: false })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    console.log('[items.get.ts] Applying pagination:', { from, to })
    supabaseQuery = supabaseQuery.range(from, to)

    // Execute query
    console.log('[items.get.ts] Executing query...')
    const { data, error } = await supabaseQuery
    console.log('[items.get.ts] Query executed. Error:', error ? 'YES' : 'NO', 'Data count:', data?.length || 0)

    if (error) {
      const errorInfo = {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status,
        sort,
        page,
        pageSize,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      }
      console.error('Database error in items.get.ts:', errorInfo)
      console.error('Full Supabase error object:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error',
        data: { 
          error: error.message || 'Unknown database error',
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || '',
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }
      })
    }

    return {
      ok: true,
      data: data || [],
      page,
      pageSize
    }
  } catch (err: any) {
    // Catch any unexpected errors
    console.error('Unexpected error in items.get.ts:', err)
    console.error('Error stack:', err.stack)
    console.error('Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    
    // If it's already a createError, re-throw it with enhanced data
    if (err.statusCode && err.data) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { 
        error: err.message || 'Unknown error occurred',
        originalError: err.toString(),
        stack: err.stack,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
      }
    })
  }
})
