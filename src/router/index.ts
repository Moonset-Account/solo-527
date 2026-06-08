import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import LevelSelectPage from '@/pages/LevelSelectPage.vue'
import GamePage from '@/pages/GamePage.vue'
import ResultPage from '@/pages/ResultPage.vue'
import CardCollectionPage from '@/pages/CardCollectionPage.vue'
import CardDetailPage from '@/pages/CardDetailPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/levels',
    name: 'levels',
    component: LevelSelectPage,
  },
  {
    path: '/game/:chapterId/:levelId',
    name: 'game',
    component: GamePage,
  },
  {
    path: '/result/:chapterId/:levelId',
    name: 'result',
    component: ResultPage,
  },
  {
    path: '/cards',
    name: 'cards',
    component: CardCollectionPage,
  },
  {
    path: '/cards/:cardId',
    name: 'cardDetail',
    component: CardDetailPage,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
