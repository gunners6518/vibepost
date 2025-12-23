/**
 * Scoring system for items
 * Combines base score (rule-based) with preference adjustments (learning-based)
 */

interface ItemForScoring {
  title?: string | null
  content_snippet?: string | null
  published_at?: string | null
  tags?: string[] | null
}

interface PreferenceKeyword {
  keyword: string
  weight: number
}

/**
 * Extract keywords from text (simple word extraction)
 */
function extractKeywords(text: string): string[] {
  if (!text) return []
  
  // Convert to lowercase and split by common delimiters
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3) // Only words with 3+ characters
  
  return [...new Set(words)] // Remove duplicates
}

/**
 * Calculate base score (rule-based, max 100)
 */
export function calculateBaseScore(item: ItemForScoring): number {
  let score = 0
  const title = (item.title || '').toLowerCase()
  const snippet = (item.content_snippet || '').toLowerCase()
  const text = `${title} ${snippet}`

  // Frontend keywords (React, TypeScript, JavaScript, CSS, HTML, Next, Nuxt, Vue, Vite, etc.)
  const frontendKeywords = [
    'react', 'typescript', 'javascript', 'js', 'css', 'html', 'next', 'nuxt', 
    'vue', 'vite', 'tailwind', 'svelte', 'angular', 'webpack', 'rollup', 
    'esbuild', 'tsx', 'jsx', 'styled-components', 'emotion', 'sass', 'scss',
    'less', 'postcss', 'babel', 'eslint', 'prettier', 'jest', 'vitest'
  ]
  const frontendMatches = frontendKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length
  if (frontendMatches > 0) {
    score += Math.min(20 + (frontendMatches - 1) * 5, 40) // +20 to +40
  }

  // Web overall keywords (browser, performance, accessibility, a11y, LCP, INP, SEO, security, etc.)
  const webKeywords = [
    'browser', 'performance', 'accessibility', 'a11y', 'lcp', 'inp', 'fcp', 
    'ttfb', 'cls', 'fid', 'seo', 'security', 'xss', 'csrf', 'cors', 'csp',
    'pwa', 'service worker', 'web worker', 'indexeddb', 'localstorage',
    'cookies', 'sessionstorage', 'http', 'https', 'tls', 'ssl'
  ]
  const webMatches = webKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length
  if (webMatches > 0) {
    score += Math.min(10 + (webMatches - 1) * 3, 25) // +10 to +25
  }

  // Engineering life keywords (career, productivity, team, scrum, code review, management, etc.)
  const engLifeKeywords = [
    'career', 'productivity', 'team', 'scrum', 'code review', 'management',
    'agile', 'sprint', 'retrospective', 'standup', 'pair programming',
    'mentor', 'mentoring', 'interview', 'resume', 'cv', 'portfolio',
    'remote', 'work', 'workflow', 'tool', 'tools', 'automation'
  ]
  const engLifeMatches = engLifeKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length
  if (engLifeMatches > 0) {
    score += Math.min(10 + (engLifeMatches - 1) * 2, 20) // +10 to +20
  }

  // Gadget keywords (keyboard, monitor, mouse, mac, desk, etc.)
  const gadgetKeywords = [
    'keyboard', 'monitor', 'mouse', 'mac', 'macbook', 'desk', 'desktop',
    'laptop', 'ipad', 'iphone', 'airpods', 'mousepad', 'stand', 'dock',
    'charger', 'cable', 'usb', 'thunderbolt', 'display', 'screen', 'trackpad'
  ]
  const gadgetMatches = gadgetKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length
  if (gadgetMatches > 0) {
    score += Math.min(10 + (gadgetMatches - 1) * 2, 20) // +10 to +20
  }

  // Published within 7 days: +10
  if (item.published_at) {
    const publishedDate = new Date(item.published_at)
    const now = new Date()
    const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff <= 7) {
      score += 10
    }
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Build preference keyword dictionary from item_actions
 * Returns a map of keyword -> weight
 */
export function buildPreferenceDictionary(
  itemActions: Array<{
    item_id: string
    action: string
    item?: { title?: string | null; content_snippet?: string | null }
  }>,
  recentCount: number = 200
): Map<string, number> {
  const keywordWeights = new Map<string, number>()
  
  // Take only recent actions
  const recentActions = itemActions.slice(0, recentCount)
  
  for (const action of recentActions) {
    if (!action.item) continue
    
    const title = (action.item.title || '').toLowerCase()
    const snippet = (action.item.content_snippet || '').toLowerCase()
    const text = `${title} ${snippet}`
    const keywords = extractKeywords(text)
    
    // Positive actions: drafted, read_later, used -> weight +
    // Negative actions: skipped -> weight -
    const weight = action.action === 'skipped' ? -1 : 1
    
    for (const keyword of keywords) {
      const currentWeight = keywordWeights.get(keyword) || 0
      keywordWeights.set(keyword, currentWeight + weight)
    }
  }
  
  return keywordWeights
}

/**
 * Calculate preference adjustment based on learned preferences
 * Returns adjustment in range -20 to +20
 */
export function calculatePreferenceAdjustment(
  item: ItemForScoring,
  preferenceDict: Map<string, number>
): number {
  if (preferenceDict.size === 0) return 0
  
  const title = (item.title || '').toLowerCase()
  const snippet = (item.content_snippet || '').toLowerCase()
  const text = `${title} ${snippet}`
  const keywords = extractKeywords(text)
  
  let totalWeight = 0
  let matchCount = 0
  
  for (const keyword of keywords) {
    const weight = preferenceDict.get(keyword)
    if (weight !== undefined) {
      totalWeight += weight
      matchCount++
    }
  }
  
  if (matchCount === 0) return 0
  
  // Normalize: average weight per match, then scale to -20 to +20 range
  const avgWeight = totalWeight / matchCount
  const adjustment = Math.max(-20, Math.min(20, avgWeight * 2))
  
  return Math.round(adjustment)
}

/**
 * Calculate final score (base + preference adjustment)
 */
export function calculateScore(
  item: ItemForScoring,
  preferenceDict?: Map<string, number>
): number {
  const baseScore = calculateBaseScore(item)
  const preferenceAdjustment = preferenceDict 
    ? calculatePreferenceAdjustment(item, preferenceDict)
    : 0
  
  const finalScore = baseScore + preferenceAdjustment
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(finalScore)))
}

