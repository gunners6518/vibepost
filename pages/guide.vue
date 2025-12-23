<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">運用ルール</h1>
        <p class="text-sm text-gray-500">スコアリングシステムと好み学習を活用した効果的な運用ガイド</p>
      </div>

      <!-- Daily Routine Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">毎日のルーチン</h2>
        </div>
        <div class="prose max-w-none">
          <ul class="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>score >= 60</strong> のアイテムだけを見る（デフォルト設定）</li>
            <li><strong>Draft を 2〜3件</strong> 作成する</li>
            <li>高スコアの記事は好みに合いやすいので、効率的に投稿候補を作れます</li>
          </ul>
        </div>
      </div>

      <!-- Decision Making Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">迷った時の判断基準</h2>
        </div>
        <div class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-900">Read Later（あとで読む）</h3>
                <p class="mt-1 text-sm text-green-700">
                  興味があるが時間がない、または内容をじっくり読みたい記事に使用。好み学習に<strong>正の影響</strong>を与えます。
                </p>
              </div>
            </div>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-900">Skip（スキップ）</h3>
                <p class="mt-1 text-sm text-yellow-700">
                  興味がない、または関連性の低い記事に使用。好み学習に<strong>負の影響</strong>を与え、今後同様の記事のスコアを下げます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Task Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">週1回のメンテナンス</h2>
        </div>
        <div class="prose max-w-none">
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-gray-700 mb-3">
              <strong>「再スコアリング」ボタン</strong>を実行して、蓄積された好み情報を全アイテムに反映させます。
            </p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700 text-sm">
              <li>直近200件の操作履歴から好みキーワードを抽出</li>
              <li>全アイテムのスコアを再計算（最大500件）</li>
              <li>より精度の高い推薦が可能になります</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Best Practices Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">効果的な運用のコツ</h2>
        </div>
        <div class="space-y-4">
          <div class="border-l-4 border-indigo-500 pl-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">1. 一貫性のある判断</h3>
            <p class="text-sm text-gray-600">
              同じような記事には同じ操作をすることで、システムがより正確に好みを学習します。
            </p>
          </div>
          <div class="border-l-4 border-indigo-500 pl-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">2. Read Later を積極活用</h3>
            <p class="text-sm text-gray-600">
              迷った時は「Read Later」を選ぶと、後で見返す機会も増え、好み学習にも貢献します。
            </p>
          </div>
          <div class="border-l-4 border-indigo-500 pl-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">3. スコアの変動を観察</h3>
            <p class="text-sm text-gray-600">
              操作を重ねるごとにスコアが変化していく様子を確認すると、学習の効果を実感できます。
            </p>
          </div>
          <div class="border-l-4 border-indigo-500 pl-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">4. 定期的な再スコアリング</h3>
            <p class="text-sm text-gray-600">
              週1回の再スコアリングを習慣化することで、常に最新の好みが反映された状態を保てます。
            </p>
          </div>
        </div>
      </div>

      <!-- Score Explanation Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900">スコアの仕組み</h2>
        </div>
        <div class="prose max-w-none text-sm text-gray-700">
          <p class="mb-3">
            スコアは<strong>ベーススコア（ルールベース）</strong>と<strong>好み補正（学習ベース）</strong>の合計で計算されます。
          </p>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div><strong>ベーススコア（最大100点）:</strong></div>
            <ul class="list-disc pl-6 space-y-1">
              <li>フロントエンド関連: +20〜+40点</li>
              <li>Web全体（パフォーマンス、SEO等）: +10〜+25点</li>
              <li>エンジニアリングライフ: +10〜+20点</li>
              <li>ガジェット関連: +10〜+20点</li>
              <li>7日以内の公開: +10点</li>
            </ul>
            <div class="mt-3"><strong>好み補正（-20〜+20点）:</strong></div>
            <ul class="list-disc pl-6 space-y-1">
              <li>Read Later / Draft 操作: 正の重み</li>
              <li>Skip 操作: 負の重み</li>
              <li>直近200件の操作履歴から好みキーワードを抽出</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO and page metadata
useHead({
  title: '運用ルール - Vibepost',
  meta: [
    {
      name: 'description',
      content: 'スコアリングシステムと好み学習を活用した効果的な運用ガイド'
    }
  ]
})
</script>

