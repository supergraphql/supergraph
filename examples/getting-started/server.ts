import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import { expressPlayground } from 'graphql-playground-middleware'
import { schema, resolve } from 'qewl'

async function run() {

  const app = express()

  const grapqhl = express.Router()
  graphql.use(
    schema(`
      type HelloPayload {
        message: String
      }
 
      type Query {
        hello: HelloPayload
      }
    `)
  )

  graphql.use(
    resolve('Query.hello', async (event) => {
      return { message: `Hello ${event.args.name}!` }
    })
  )

  app.use('/graphql', express.json(), graphql, await serve())

  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.listen(3000, () => console.log('Server running. Open http://localhost:3000/playground to run queries.'))
}

run()
