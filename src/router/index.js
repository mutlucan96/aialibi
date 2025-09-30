import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import PresenterView from '../views/PresenterView.vue'
import ImpressumView from '@/views/ImpressumView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/game/:gameId',
      name: 'game',
      component: GameView,
      props: true,
    },
    {
      path: '/presenter/:gameId',
      name: 'presenter',
      component: PresenterView,
      props: true,
    },
    {
      path: '/imp',
      name: 'impressum',
      component: ImpressumView,
    },
  ],
})

export default router
