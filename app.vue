<template>
  <div>
    <!-- Navigation Menu -->
    <nav style="background: #f8f9fa; border-bottom: 1px solid #ddd; padding: 0 20px;">
      <div style="display: flex; align-items: center; gap: 20px; max-width: 1200px; margin: 0 auto;">
        <div style="font-size: 20px; font-weight: bold; padding: 15px 0; color: #333;">
          俺のブログ管理
        </div>
        <div style="display: flex; gap: 10px; flex: 1;">
          <NuxtLink
            to="/items"
            style="padding: 15px 20px; text-decoration: none; color: #333; border-bottom: 2px solid transparent; transition: all 0.2s;"
            active-class="active"
          >
            記事
          </NuxtLink>
          <NuxtLink
            to="/sources"
            style="padding: 15px 20px; text-decoration: none; color: #333; border-bottom: 2px solid transparent; transition: all 0.2s;"
            active-class="active"
          >
            RSS登録
          </NuxtLink>
          <NuxtLink
            to="/guide"
            style="padding: 15px 20px; text-decoration: none; color: #333; border-bottom: 2px solid transparent; transition: all 0.2s;"
            active-class="active"
          >
            運用ルール
          </NuxtLink>
        </div>
      </div>
    </nav>
    <NuxtPage />
    <ToastContainer />
  </div>
</template>

<style>
nav a.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: 500;
}

nav a:hover {
  color: #007bff;
  background: rgba(0, 123, 255, 0.05);
}
</style>

