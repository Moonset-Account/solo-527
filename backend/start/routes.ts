import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.get('/', async () => {
  return {
    code: 0,
    message: 'ok',
    data: {
      service: 'sales-email-assistant-api',
      version: '1.0.0',
      status: 'running',
    },
  }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('/login', '#controllers/auth_controller.login')
      })
      .prefix('/auth')

    router
      .group(() => {
        router
          .group(() => {
            router.get('/me', '#controllers/auth_controller.me')
            router.post('/logout', '#controllers/auth_controller.logout')
          })
          .prefix('/auth')
          .middleware(middleware.auth())

        router
          .group(() => {
            router.post('/generate', '#controllers/emails_controller.generate')
            router.get('/', '#controllers/emails_controller.index')
            router.get('/:id', '#controllers/emails_controller.show')
            router.post('/:id/submit-review', '#controllers/emails_controller.submitReview')
          })
          .prefix('/emails')
          .middleware(middleware.sales())

        router
          .group(() => {
            router.post('/search', '#controllers/knowledge_controller.search')
            router.get('/', '#controllers/knowledge_controller.index')
          })
          .prefix('/knowledge')
          .middleware(middleware.sales())

        router
          .group(() => {
            router.get('/', '#controllers/templates_controller.index')
          })
          .prefix('/templates')
          .middleware(middleware.sales())

        router
          .group(() => {
            router
              .group(() => {
                router.post('/', '#controllers/knowledge_controller.store')
                router.get('/:id', '#controllers/knowledge_controller.show')
                router.put('/:id', '#controllers/knowledge_controller.update')
                router.delete('/:id', '#controllers/knowledge_controller.destroy')
              })
              .prefix('/knowledge')

            router
              .group(() => {
                router.post('/', '#controllers/templates_controller.store')
                router.get('/:id', '#controllers/templates_controller.show')
                router.put('/:id', '#controllers/templates_controller.update')
                router.delete('/:id', '#controllers/templates_controller.destroy')
                router.post('/:id/versions', '#controllers/templates_controller.createVersion')
                router.put('/:id/versions/:versionId/publish', '#controllers/templates_controller.publishVersion')
              })
              .prefix('/templates')

            router
              .group(() => {
                router.get('/', '#controllers/prompts_controller.index')
                router.post('/', '#controllers/prompts_controller.store')
                router.get('/:id', '#controllers/prompts_controller.show')
                router.put('/:id', '#controllers/prompts_controller.update')
                router.delete('/:id', '#controllers/prompts_controller.destroy')
                router.put('/:id/publish', '#controllers/prompts_controller.publish')
              })
              .prefix('/prompts')

            router
              .group(() => {
                router.get('/', '#controllers/reviews_controller.index')
                router.put('/:id/approve', '#controllers/reviews_controller.approve')
                router.put('/:id/reject', '#controllers/reviews_controller.reject')
              })
              .prefix('/reviews')

            router
              .group(() => {
                router.get('/', '#controllers/risks_controller.index')
                router.get('/:id', '#controllers/risks_controller.show')
                router.put('/:id', '#controllers/risks_controller.update')
                router.delete('/:id', '#controllers/risks_controller.destroy')
                router.post('/:id/mark-negative', '#controllers/risks_controller.markNegative')
              })
              .prefix('/risks')

            router
              .group(() => {
                router.get('/', '#controllers/logs_controller.index')
                router.get('/stats', '#controllers/logs_controller.stats')
              })
              .prefix('/logs')

            router
              .group(() => {
                router.get('/summary', '#controllers/analytics_controller.summary')
                router.get('/cost-breakdown', '#controllers/analytics_controller.costBreakdown')
                router.get('/hit-rate', '#controllers/analytics_controller.hitRate')
                router.get('/reject-reasons', '#controllers/analytics_controller.rejectReasons')
                router.get('/version-effect', '#controllers/analytics_controller.versionEffect')
              })
              .prefix('/analytics')
              .middleware(middleware.admin())
          })
          .middleware(middleware.ops())
      })
      .middleware(middleware.operationLog())
  })
  .prefix('/api/v1')
