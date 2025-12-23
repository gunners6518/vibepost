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

  // Helper function to validate and fix generated text
  const validateAndFixText = async (text: string, link: string): Promise<string> => {
    let validatedText = text.trim()
    
    // Check if text exceeds 300 characters
    if (validatedText.length > 300) {
      console.log(`[Draft API] Text exceeds 300 characters (${validatedText.length}), requesting rewrite...`)
      const rewriteResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'あなたはX（旧Twitter）の投稿文を200〜240文字に短縮する専門家です。内容を保ちながら、簡潔にリライトしてください。'
            },
            {
              role: 'user',
              content: `以下の投稿文を200〜240文字に短縮してください。改行は維持してください。\n\n${validatedText}`
            }
          ],
          temperature: 0.5,
          max_tokens: 300
        })
      })
      
      if (rewriteResponse.ok) {
        const rewriteData = await rewriteResponse.json()
        const rewrittenText = rewriteData.choices?.[0]?.message?.content?.trim()
        if (rewrittenText) {
          validatedText = rewrittenText
          console.log(`[Draft API] Text rewritten to ${validatedText.length} characters`)
        }
      }
    }
    
    // Check for multiple URLs and keep only one at the end
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = validatedText.match(urlRegex) || []
    
    if (urls.length > 1) {
      console.log(`[Draft API] Found ${urls.length} URLs, keeping only one at the end`)
      // Remove all URLs first
      let textWithoutUrls = validatedText
      urls.forEach(url => {
        textWithoutUrls = textWithoutUrls.replace(url, '').trim()
      })
      // Add link at the end if provided, otherwise keep the first URL
      const finalUrl = link || urls[0]
      validatedText = `${textWithoutUrls}\n\n${finalUrl}`.trim()
    } else if (link && !validatedText.includes(link)) {
      // Ensure link is included at the end if not present
      validatedText = `${validatedText}\n\n${link}`
    }
    
    return validatedText
  }

  // Helper function to get prompt for each draft type
  const getPromptForType = (type: string, title: string, contentSnippet: string, link: string): string => {
    const baseContext = `タイトル: ${title}\n内容: ${contentSnippet}\nリンク: ${link}`
    
    switch (type) {
      case 'short':
        return `${baseContext}

以下の形式で投稿文を作成してください：
1. 共感（技術者が共感できる問題提起）
2. 結論（簡潔な要点）
3. 1つのTips（実践的なアドバイス）
4. 締めの質問（読者への問いかけ）

文体：
- 一人称は「僕」
- 改行を多めに使用
- 断定しすぎない（煽らない）
- 200〜240文字目安
- 専門用語は短く補足（例: INP=入力遅延の指標）
- 最後は質問で終える（例: みんなはどうしてる？）
- リンクは文末に1回だけ置く（URL単体で改行）
- 誇張しない。未確認の断言は禁止
- titleとcontent_snippetの内容を必ず踏まえる`
      
      case 'hook':
        return `${baseContext}

以下の形式で投稿文を作成してください：
1. 逆張りor意外性のフック（常識を覆す視点）
2. 理由（なぜそうなのか）
3. 現場の例（具体的な体験談）
4. 締め（読者への問いかけ）

文体：
- 一人称は「僕」
- 改行を多めに使用
- 断定しすぎない（煽らない）
- 200〜240文字目安
- 専門用語は短く補足（例: INP=入力遅延の指標）
- 最後は質問で終える（例: みんなはどうしてる？）
- リンクは文末に1回だけ置く（URL単体で改行）
- 誇張しない。未確認の断言は禁止
- titleとcontent_snippetの内容を必ず踏まえる`
      
      case 'checklist':
        return `${baseContext}

以下の形式で投稿文を作成してください：
- 「〜の時の確認5つ」形式
- 箇条書き5つ（簡潔に）
- 各項目は改行で区切る
- 最後に質問で締める

文体：
- 一人称は「僕」
- 改行を多めに使用
- 断定しすぎない（煽らない）
- 200〜240文字目安
- 専門用語は短く補足（例: INP=入力遅延の指標）
- 最後は質問で終える（例: みんなはどうしてる？）
- リンクは文末に1回だけ置く（URL単体で改行）
- 誇張しない。未確認の断言は禁止
- titleとcontent_snippetの内容を必ず踏まえる`
      
      default:
        return baseContext
    }
  }

  // Generate 3 types of drafts using OpenAI
  const draftTypes = [
    { type: 'short', name: 'short' },
    { type: 'hook', name: 'hook' },
    { type: 'checklist', name: 'checklist' }
  ]

  const generatedDrafts: Array<{ type: string; text: string }> = []

  console.log('[Draft API] Starting OpenAI API calls...')
  for (const { type } of draftTypes) {
    try {
      console.log(`[Draft API] Generating draft type: ${type}`)
      
      const prompt = getPromptForType(type, title, contentSnippet, link)
      
      // Call OpenAI API
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
              content: 'あなたはX（旧Twitter）の投稿文を作成する専門家です。技術者に刺さって、いいね/保存/リプが増える投稿を生成してください。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 400
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

      // Validate and fix the generated text
      const validatedText = await validateAndFixText(generatedText, link)

      generatedDrafts.push({ type, text: validatedText })
      console.log(`[Draft API] Successfully generated draft type: ${type} (${validatedText.length} chars)`)
    } catch (error: any) {
      console.error(`[Draft API] Error generating draft for type ${type}:`, error.message || error)
      // Continue with other types even if one fails
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

  // Log action to item_actions for preference learning
  await supabase
    .from('item_actions')
    .insert({
      item_id: id,
      action: 'drafted',
      meta: {
        draft_count: insertedDrafts?.length || 0,
        typefully_count: typefullySuccessCount
      }
    })
    .catch(err => {
      // Log but don't fail if action logging fails
      console.error('[Draft API] Failed to log action:', err)
    })

  // Recalculate score for this item based on updated preferences
  await recalculateItemScore(supabase, id)

  return {
    ok: true,
    created: insertedDrafts?.length || 0,
    typefully: typefullySuccessCount
  }
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
    console.error('[Draft API] Failed to recalculate score:', err)
  }
}
