import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import { expressPlayground } from 'graphql-playground-middleware'
import { Qewl } from 'qewl'

async function run() {

  const app = express()

  const qewl = new Qewl()
  qewl.schema(`
      type HelloPayload {
        message: String
      }

      type Query {
        hello(name: String!): HelloPayload
      }
    `)

  qewl.router
    .resolve('Query.hello', async (event) => {
      return { message: `Hello ${event.args.name}!` }
    })

  app.use('/graphql', cors(), bodyParser.json(), await qewl.middleware())

  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.listen(3000, () => console.log('Server running. Open http://localhost:3000/playground to run queries.'))
}

run()
