# Qewl

**Qewl** (pronounced: /kuːl/, as in: 'cool') is a **GraphQL Application Framework**.
It is inspired by Koa, built on Apollo Server, and turns your GraphQL endpoint into a Koa-like application, with support for context, middleware, and many other features.

It is great for setting up an API Gateway on top of existing GraphQL endpoint, applying concepts like **remote schemas** and **schema stitching**. But it also makes it very easy to set up a GraphQL Server **from scratch**.

## Concepts

Qewl bridges the gap between commonly used patterns for HTTP middleware frameworks like Koa and Express, and GraphQL endpoints.
A GraphQL server is composed of three components:
- GraphQL schemas
- Resolvers
- Context

Qewl uses these same three components:
- GraphQL schemas define the **routes** of our server
- Resolvers define the **implementation** of these routes
- Application middleware is used to construct the **context** passed to every resolver, and router middleware is used to add **common functionality** to the resolvers

## Installation
Qewl requires **node v7.6.0** or higher for ES2015 and async function support.
```bash
$ yarn add qewl
```

## Examples

### [Getting started](./examples/getting-started#readme)
Set up your first GraphQL Server in minutes using Express and Qewl.

### [Deep Dive](./examples/deep-dive#readme)
Qewl makes it easy to set up a GraphQL Server from scratch. But this example really takes it to the next level by combining two existing GraphQL endpoints, link them together, and apply some middleware on top.

Below is an example implementation, showcasing the Qewl API:
```ts
import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import { expressPlayground } from 'graphql-playground-middleware'
import { Qewl } from 'qewl'

import { helloSchema } from './helloSchema'
import { helloResolver } from './helloResolver'

async function run() {

  const app = express()

  const qewl = new Qewl()

  // Qewl level middleware to modify the context
  qewl.use((context) => {
    const token = context.req.headers.authorization ? (context.req.headers.authorization as string).split(' ')[1] : null
    context.token = token
  })

  // Add a remote schema
  qewl.remoteSchema({
    name: 'graphcoolSchema',
    uri: process.env.GRAPHCOOL_ENDPOINT,
    authenticationToken: (context) => (context.graphqlContext || {}).token
  })

  // Add typedefinitions with a name (for referencing it later if needed)
  qewl.schema({name: 'hello', schema: helloSchema})

  // Add an inline type definition, directly providing a string
  qewl.schema(`extend type Query { myPosts: [Post] }`)

  // Qewl router middleware. Works like koa middleware, runs before and after the resolver
  // Path can be any type or field (Mutation, Query.allPosts, ...)
  qewl.router.use('Query', async (event, next) => {
    // Do something before
    const result = await next()
    // Do something after
    return result
  })

  // Resolver function, passed in as object (allows fragment, resolve, __resolveType)
  qewl.router.resolve('Query.hello', { resolve: helloResolver })

  // Resolver function, passed in directly, using a helper function delegate
  // Other helper functions: delegate, delegateQuery, addTypeNameField, addFields
  qewl.router.resolve('Query.myPosts', async(event) => {
    return event.delegate('query', 'allPosts')
  })

  // Use qewl as middleware, wrapping apollo-server-express
  app.use('/graphql', cors(), bodyParser.json(), await qewl.middleware())
  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.listen(3000, () => console.log('Server running. Open http://localhost:3000/playground to run queries.'))
}

run().catch(console.error.bind(console))
```

## Documentation

### `new Qewl()`

Initialize a new Qewl application. This initializes a new GraphQL context, with the following structure:
- `context.schemas` will contain all GraphQL schemas added to the application
- `context.req` exposes the Express context `Request` object

### `use(async (context) => {...})` or
### `use((context) => {...})`

Specify a application middleware function (either async or common) that modifies the GraphQL context. All middlewares will run in the same order they are specified.

### `schema({name?: string, schema: GraphQLSchema | string})` or
### `schema(schema: GraphQLSchema | string)`

Adds a GraphQL schema to the Qewl application. This can either be a full GraphQLSchema or a Type definition string. Optionally you can specify a name for the schema, so you can reference it anywhere using `context.schemas.schemaName`. This is actually a convenient shorthand for the `schema` Qewl middleware function: `use(schema(...))`

### `remoteSchema({name?: string, uri?: string, introspectionSchema?: GraphQLSchema, authenticationToken?: (context) => string})` or
### `remoteSchema({name?: string, link?: ApolloLink, introspectionSchema?: GraphQLSchema, authenticationToken?: (context) => string})`

Adds a schema for a remote GraphQL endpoint to the Qewl Application. You can either specify a URL for the endpoint, or pass in an existing `ApolloLink`.
You can optionally pass in an introspectionSchema. If you don't, Qewl will run the introspection query against your endpoint to retrieve the schema.
You can also optionally pass in a function that retrieves the authenticationToken from the GraphQL context. It will be added as Bearer token to the Authorization header for this remote endpoint. For more complex scenarios, use the possibility to pass in your own `ApolloLink` definition.

### `router.use(path: '...', fn: async (event, next) => {...}`)

Specify a router middleware for a certain GraphQL path. You can specify multiple middlewares for the same path, and each middleware can specify actions before and after the next middleware or resolver runs (like Koa). The basic syntax is:
```ts
(event, next) => {
  // Do something before
  const result = await next()
  // Do something after
  return result
}
```
The `event` object contains the following properties:
- `parent`, `args`, `context` and `info`. These are the common resolver parameters.
- `addFields`. Helper method to add fields to the resolver (see below).

### `router.resolve(path: '...', fn: async (event) => {...}`

Specify a resolver for a GraphQL path. You can only specify one resolver per GraphQL path. The `event` object contains the same properties as above, and also:
- `addTypenameField()`. Helper method. See below
- `delegate()`. Helper method to delegate execution to an existing query or mutation (useful for schema stitching). See below
- `delegateQuery()`. Helper method to execute a custom query or mutation against your underlying schema (useful for schema stitching). See below

### `await qewl.middleware({serverOptions})`

This method exposes the Express middleware for your Qewl application. You add it to your GraphQL Express route (`/graphql`). It accepts the following Apollo Server serverOptions, that it will pass through to Apollo Server:
* **rootValue**: the value passed to the first resolve function
* **formatError**: a function to apply to every error before sending the response to clients
* **validationRules**: additional GraphQL validation rules to be applied to client-specified queries
* **formatParams**: a function applied for each query in a batch to format parameters before execution
* **formatResponse**: a function applied to each response after execution
* **tracing**: when set to true, collect and expose trace data in the [Apollo Tracing format](https://github.com/apollographql/apollo-tracing)


### Helper methods

Qewl comes with a number of helper methods that you can use inside your resolvers:

#### `addFields(fields: [FieldNode | string] | FieldNode | string)`

Helper method to add one or more fields to your query. This is useful when you need a specific field to be part of the query result for further processing, even if the user doesn't specify it in their query.

#### `addTypenameField()`

Helper method to add the `__typename` field to your query fields. This is useful for resolvers for interface and union fields, that require the `__typename` field for Type resolving. This is an explicit shorthand for `addFields('__typename')`. It is a separate function because it is to be expected that `graphql-tools` will support this out of the box soon, so you don't have to specify this field manually anymore.

#### `delegate(operationType: 'query' | 'mutation', operationName: '...', args?: {...})`

This is a helper method for `mergeInfo.delegate`, and one of the most used methods when defining resolvers for **schema stitching**. It delegates the execution to the query or mutation with the specified operationName. Optionally, you can specify query arguments. If you don't specify arguments, the resolver arguments will be injected automatically.

#### `delegateQuery(query: string, args?: {...})`

This is a helper method that works like `mergeInfo.delegate`, but instead of specifying an operationName, you can define a custom query. This is very useful for executing a query that is unrelated to the resolver (for example, retrieve user data). As with `delegate`, arguments are optional, and will be injected automatically.

## Alternative syntax _(coming soon)_

Most of the Qewl components are also available directly as Express middleware functions. Some more advanced features might not be available.

```ts
import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import { expressPlayground } from 'graphql-playground-middleware'
import { schema, remoteSchema, use, resolve } from 'qewl'

import { helloSchema } from './helloSchema'
import { helloResolver } from './helloResolver'

async function run() {

  const app = express()
  const graphql = express.Router()

  // Context
  graphql.use(
    (req, res, next) => {
      const token = req.headers.authorization ? (req.headers.authorization as string).split(' ')[1] : null
      req.token = token
      next()
    }
  )

  // Schemas
  graphql.use(
    remoteSchema({
      name: 'graphcoolSchema',
      uri: process.env.GRAPHCOOL_ENDPOINT,
      authenticationToken: (context) => (context.graphqlContext || {}).token
    }),
    schema({name: 'hello', schema: helloSchema}),
    schema(`extend type Query { myPosts: [Post] }`)
  )

  // Resolvers middlewares
  graphql.use(
    use('Query', async (event, next) => {
      // Do something before
      const result = await next()
      // Do something after
      return result
    })
  )

  // Resolvers
  graphql.use(
    resolve('Query.hello', { resolve: helloResolver }),

    resolve('Query.myPosts', async(event) => {
      return event.delegate('query', 'allPosts')),
  )

  // Endpoint
  graphql.use(
    cors(),
    bodyParser.json(),
    await qewl()
  )

  app.use('/graphql', graphql)
  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.listen(3000, () => console.log('Server running. Open http://localhost:3000/playground to run queries.'))
}

run().catch(console.error.bind(console))
```

## Support for other server frameworks

Support for other server frameworks (Hapi, Koa, Restify, Lambda, Micro and Azure Functions) will be released soon!

## Additional middlewares

Additional useful Qewl application and router middlewares (for logging, authentication, mocking, etc.) will be released soon as a separate package!

## Contributing

If you run into any issue using Qewl, or if you have a feature request, please open an [issue](https://github.com/kbrandwijk/qewl/issues/new).
