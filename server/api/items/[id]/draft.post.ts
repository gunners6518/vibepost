export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID is required',
      data: { error: 'Missing item ID' }
    })
  }

  console.log(`[Draft API] Starting draft creation for item: ${id}`)

  const config = useRuntimeConfig(event)
  const supabase = getSupabaseAdmin(event)

  // Validate API keys
  console.log('[Draft API] Validating API keys...')
  if (!config.openaiApiKey) {
    console.error('[Draft API] OpenAI API key is missing')
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key is not configured',
      data: { error: 'OPENAI_API_KEY environment variable is required' }
    })
  }

  if (!config.typefullyApiKey) {
    console.error('[Draft API] Typefully API key is missing')
    throw createError({
      statusCode: 500,
      statusMessage: 'Typefully API key is not configured',
      data: { error: 'TYPEFULLY_API_KEY environment variable is required' }
    })
  }

  if (!config.typefullySocialSetId) {
    console.error('[Draft API] Typefully Social Set ID is missing')
    throw createError({
      statusCode: 500,
      statusMessage: 'Typefully Social Set ID is not configured',
      data: { error: 'TYPEFULLY_SOCIAL_SET_ID environment variable is required' }
    })
  }
  console.log('[Draft API] API keys validated')

  // Get item first
  console.log('[Draft API] Fetching item from database...')
  const { data: item, error: fetchError } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('[Draft API] Failed to fetch item:', fetchError)
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found',
      data: { error: fetchError.message }
    })
  }
  console.log('[Draft API] Item fetched successfully')

  const title = item.title || ''
  const link = item.link || ''
  const contentSnippet = item.content_snippet || ''

  // Prepare context for OpenAI
  const context = `
タイトル: ${title}
リンク: ${link}
内容: ${contentSnippet}
`.trim()

  // Generate 3 types of drafts using OpenAI
  const draftTypes = [
    { type: 'short', description: '短い投稿文（200文字程度）' },
    { type: 'quote', description: '引用形式の投稿文（200文字程度）' },
    { type: 'thread_hook', description: 'スレッドの冒頭に使える投稿文（200文字程度）' }
  ]

  const generatedDrafts: Array<{ type: string; text: string }> = []

  console.log('[Draft API] Starting OpenAI API calls...')
  for (const { type, description } of draftTypes) {
    try {
      console.log(`[Draft API] Generating draft type: ${type}`)
      // Call OpenAI API
      // Endpoint: POST https://api.openai.com/v1/chat/completions
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'あなたはX（旧Twitter）の投稿文を作成する専門家です。200文字程度の投稿文を作成してください。改行を多めに使い、断定しすぎず、初心者にも伝わる表現を心がけてください。一人称は「僕」を使ってください。'
            },
            {
              role: 'user',
              content: `以下の記事について、${description}を作成してください。\n\n${context}\n\nリンクは末尾に含めてください。`
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${JSON.stringify(errorData)}`)
      }

      const openaiData = await openaiResponse.json()
      const generatedText = openaiData.choices?.[0]?.message?.content?.trim()

      if (!generatedText) {
        throw new Error('OpenAI API returned empty response')
      }

      // Ensure link is included at the end
      let finalText = generatedText
      if (link && !finalText.includes(link)) {
        finalText = `${finalText}\n\n${link}`
      }

      generatedDrafts.push({ type, text: finalText })
      console.log(`[Draft API] Successfully generated draft type: ${type}`)
    } catch (error: any) {
      console.error(`[Draft API] Error generating draft for type ${type}:`, error.message || error)
      // Continue with other types even if one fails
      // You might want to handle this differently based on requirements
    }
  }

  console.log(`[Draft API] Generated ${generatedDrafts.length} drafts`)

  if (generatedDrafts.length === 0) {
    console.error('[Draft API] All OpenAI API calls failed')
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate any drafts',
      data: { error: 'All OpenAI API calls failed. Check server logs for details.' }
    })
  }

  // Save drafts to database
  console.log('[Draft API] Saving drafts to database...')
  const draftsToInsert = generatedDrafts.map(draft => ({
    item_id: id,
    draft_type: draft.type, // Use draft_type to match existing table schema
    type: draft.type, // Also set type column
    text: draft.text,
    status: 'pending'
  }))

  console.log('[Draft API] Drafts to insert:', JSON.stringify(draftsToInsert, null, 2))

  const { data: insertedDrafts, error: insertError } = await supabase
    .from('drafts')
    .insert(draftsToInsert)
    .select()

  if (insertError) {
    console.error('[Draft API] Database insert error:', insertError)
    console.error('[Draft API] Error details:', JSON.stringify(insertError, null, 2))
    console.error('[Draft API] Error code:', insertError.code)
    console.error('[Draft API] Error message:', insertError.message)
    console.error('[Draft API] Error details:', insertError.details)
    console.error('[Draft API] Error hint:', insertError.hint)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { 
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        message: `Failed to insert drafts. Error: ${insertError.message}. Code: ${insertError.code || 'unknown'}. Details: ${insertError.details || 'none'}. Hint: ${insertError.hint || 'none'}`,
        fullError: JSON.stringify(insertError, null, 2)
      }
    })
  }
  console.log(`[Draft API] Successfully saved ${insertedDrafts?.length || 0} drafts to database`)

  // Create drafts in Typefully
  // Endpoint: POST https://api.typefully.com/v2/social-sets/{social_set_id}/drafts
  let typefullySuccessCount = 0

  for (const draft of insertedDrafts || []) {
    try {
      const typefullyResponse = await fetch(
        `https://api.typefully.com/v2/social-sets/${config.typefullySocialSetId}/drafts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.typefullyApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            platforms: {
              x: {
                enabled: true,
                posts: [
                  { text: draft.text }
                ]
              }
            }
          })
        }
      )

      if (!typefullyResponse.ok) {
        const errorData = await typefullyResponse.text()
        console.error(`Typefully API error for draft ${draft.id}:`, errorData)
        // Update draft status to failed
        await supabase
          .from('drafts')
          .update({ status: 'failed' })
          .eq('id', draft.id)
        continue
      }

      const typefullyData = await typefullyResponse.json()
      
      // Extract draft ID and URL from response
      // Typefully API v2 response structure may vary, adjust based on actual response
      const typefullyDraftId = typefullyData.id || typefullyData.draft_id || null
      const typefullyUrl = typefullyData.url || typefullyData.draft_url || null

      // Update draft with Typefully information
      await supabase
        .from('drafts')
        .update({
          status: 'created',
          typefully_draft_id: typefullyDraftId,
          typefully_url: typefullyUrl
        })
        .eq('id', draft.id)

      typefullySuccessCount++
    } catch (error: any) {
      console.error(`Error creating Typefully draft for ${draft.id}:`, error)
      // Update draft status to failed
      await supabase
        .from('drafts')
        .update({ status: 'failed' })
        .eq('id', draft.id)
    }
  }

  // Update item status to 'drafted'
  console.log('[Draft API] Updating item status to drafted...')
  const { error: updateError } = await supabase
    .from('items')
    .update({ status: 'drafted' })
    .eq('id', id)

  if (updateError) {
    console.error('[Draft API] Database update error:', updateError)
    console.error('[Draft API] Update error code:', updateError.code)
    console.error('[Draft API] Update error message:', updateError.message)
    
    // If drafts were successfully created, return partial success instead of throwing error
    // This allows the drafts to be saved even if status update fails
    if (insertedDrafts && insertedDrafts.length > 0) {
      console.warn('[Draft API] Drafts were created but item status update failed. Returning partial success.')
      return {
        ok: true,
        created: insertedDrafts.length,
        typefully: typefullySuccessCount,
        warning: `Drafts created successfully, but failed to update item status: ${updateError.message}. Please refresh schema cache.`
      }
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Database error',
      data: { 
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        message: `Failed to update item status. Error: ${updateError.message}. Code: ${updateError.code || 'unknown'}. This is likely a schema cache issue. Please refresh the schema cache in Supabase Dashboard.`
      }
    })
  }
  
  console.log('[Draft API] Item status updated successfully')

  return {
    ok: true,
    created: insertedDrafts?.length || 0,
    typefully: typefullySuccessCount
  }
})
