export default class ForceJsonResponse {
  async handle(ctx, next) {
    ctx.response.header('Content-Type', 'application/json')
    await next()
  }
}
