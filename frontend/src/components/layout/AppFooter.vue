<template>
  <footer class="bg-wood-800 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <span class="text-2xl">🏺</span>
            <span class="font-display text-xl font-bold">匠心手作</span>
          </div>
          <p class="text-wood-300 text-sm leading-relaxed">
            专注陶艺、银饰、皮具等手作课程，让每一位学员都能体验手工创作的乐趣，留下专属的匠心作品。
          </p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">课程分类</h4>
          <ul class="space-y-2 text-sm text-wood-300">
            <li><router-link to="/courses?category=pottery" class="hover:text-white transition-colors">陶艺课程</router-link></li>
            <li><router-link to="/courses?category=silver" class="hover:text-white transition-colors">银饰课程</router-link></li>
            <li><router-link to="/courses?category=leather" class="hover:text-white transition-colors">皮具课程</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">关于我们</h4>
          <ul class="space-y-2 text-sm text-wood-300">
            <li><a href="#" class="hover:text-white transition-colors">工作室介绍</a></li>
            <li><a href="#" class="hover:text-white transition-colors">师资团队</a></li>
            <li><a href="#" class="hover:text-white transition-colors">联系方式</a></li>
            <li><a href="#" class="hover:text-white transition-colors">隐私政策</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">联系我们</h4>
          <ul class="space-y-2 text-sm text-wood-300">
            <li class="flex items-center space-x-2">
              <span>📍</span>
              <span>北京市朝阳区创意园区A座301</span>
            </li>
            <li class="flex items-center space-x-2">
              <span>📞</span>
              <span>400-123-4567</span>
            </li>
            <li class="flex items-center space-x-2">
              <span>✉️</span>
              <span>hello@jiangxin.com</span>
            </li>
            <li class="flex items-center space-x-2">
              <span>⏰</span>
              <span>周二至周日 10:00-20:00</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-wood-700 mt-8 pt-8 text-center text-sm text-wood-400">
        <p>© 2024 匠心手作工坊 版权所有 | 京ICP备12345678号</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
