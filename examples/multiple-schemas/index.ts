require('dotenv').config()

import * as express from 'express'
import expressPlayground from 'graphql-playground-middleware-express'
import { remoteSchema, schema, resolver, serve, use, transform } from 'qewl'

async function run() {
  const app = express()
  const graphql = express.Router()

  // Schemas
  graphql.use(
    remoteSchema({
      uri:
        process.env.GRAPHCOOL_ADDRESS_ENDPOINT || 'https://api.graph.cool/simple/v1/cj97mysum1jyi01363osr460n'
    }),

    remoteSchema({
      uri:
        process.env.GRAPHCOOL_WEATHER_ENDPOINT || 'https://api.graph.cool/simple/v1/cj97mrhgb1jta01369lzb0tam'
    }),

    schema(`
      extend type Address {
        weather: WeatherPayload
      }

      extend type WeatherPayload {
        temp(unit: UnitEnum): Float
      }

      enum UnitEnum {
        Celcius,
        Fahrenheit
      }`)
  )

  // Resolvers
  graphql.use(
    resolver('Address.weather', {
      fragment: `fragment AddressFragment on Address { city }`,
      resolve: event => {
        const { city } = event.parent
        return event.delegate('query', 'getWeatherByCity', { city })
      }
    }),

    resolver('WeatherPayload.temp', {
      fragment: `fragment WeatherPayloadFragment on WeatherPayload { temperature }`,
      resolve: event => {
        const { temperature } = event.parent
        switch (event.args.unit) {
          case 'Fahrenheit':
            return temperature * 1.8 + 32
          default:
            return temperature
        }
      }
    })
  )

  // Middleware
  graphql.use(
    use('User.name', async (event, next) => {
      if (!event.context.headers.scopes || ''.includes('read:username')) {
        throw new Error('Insufficient permissions')
      } else {
        return await next()
      }
    })
  )

  // Define final schema
  graphql.use(
    transform(`
      type Query {
        getWeatherByCity(city: String): WeatherPayload
        # other queries are removed here
      }

      # Mutation type is removed entirely, because it isn't specified

      type WeatherPayload {
        temp(unit: UnitEnum): Float
        # other fields are removed here
      }

      enum UnitEnum {
        Celcius
        # other enum value is removed here
      }`)
  )

  app.use('/graphql', express.json(), graphql, await serve())
  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.listen(3000, () => console.log('Server running. Open http://localhost:3000/playground to run queries.'))
}

run().catch(console.error.bind(console))
