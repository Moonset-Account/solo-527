import { Ignitor } from '@adonisjs/core'
import env from '#start/env'

const ignitor = new Ignitor(import.meta.url)
const app = ignitor.createApp(env.get('NODE_ENV'))

app.init().then(() => {
  const server = app.container.resolveBinding('Adonis/Core/Server')
  const host = env.get('HOST')
  const port = env.get('PORT')

  server.start(host, port)

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server started on http://${host}:${port}`)
  }
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
