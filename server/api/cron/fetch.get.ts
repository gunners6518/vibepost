export default defineEventHandler((event) => {
  // まず、エンドポイントが実行されているか確認
  console.log('API endpoint called: /api/cron/fetch')
  
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const secret = Array.isArray(query.secret) ? query.secret[0] : query.secret
  
  const expectedSecret = config.cronSecret

  if (!expectedSecret || secret !== expectedSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { error: 'unauthorized' }
    })
  }

  return { ok: true }
})
