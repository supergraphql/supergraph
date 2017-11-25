# Qewl

**Qewl** (pronounced: /kuːl/, as in: 'cool') is a **GraphQL Gateway Framework**.
It is inspired by Koa, built on Apollo Server, and turns your GraphQL endpoint into a Koa-like application, with support for context, middleware, and many other features.

It is great for setting up an API Gateway on top of existing GraphQL endpoint, applying concepts like **remote schemas** and **schema stitching**. But it also makes it very easy to set up a GraphQL Server **from scratch**.

Qewl is implemented as a set of Express middlewares, so you can build a GraphQL Server as easily as a regular web server!

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
Qewl requires **node v7.6.0** or higher for ES2015 and async function support. Following common practice, it has `apollo-link` and `graphql` specified as peer dependencies, so make sure you install those too.
```bash
$ yarn add qewl apollo-link graphql
```

## Examples

### [Getting started](./examples/getting-started#readme)
Set up your first GraphQL Server in minutes using Express and Qewl.

### [Deep Dive](./examples/deep-dive#readme)
Qewl makes it easy to set up a GraphQL Server from scratch. But this example really takes it to the next level by combining two existing GraphQL endpoints, link them together, and apply some middleware on top.

Below is an example implementation, showcasing the Qewl API:
```ts
import * as express from 'express'
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
    serve()
  )

  app.use('/graphql', express.json(), graphql)
  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.listen(3000, () => console.log('Server running. Open http://localhost:3000/playground to run queries.'))
}

run().catch(console.error.bind(console))
```

## Documentation

### Express Request

Qewl add a `qewl` object to the Express Request context, with the following structure. For normal use cases, you never have to modify anything directly.
- `req.qewl.context.schemas` will contain all GraphQL schemas
- `req.qewl.context.resolvers` will contain all GraphQL resolver functions
- `req.qewl.context.middlewares` will contain all GraphQL middleware functions
- `req.qewl.context.mergedSchema` will contain the final schema used for your endpoint

### `schema({name?: string, schema: GraphQLSchema | string})` or
### `schema(schema: GraphQLSchema | string)`

Adds a GraphQL schema to the Qewl application. This can either be a full GraphQLSchema or a Type definition string. Optionally you can specify a name for the schema, so you can reference it anywhere using `context.schemas.schemaName`. This is actually a convenient shorthand for the `schema` Qewl middleware function: `use(schema(...))`

<h3><pre><code>remoteSchema({
  name?: string,
  uri?: string,
  introspectionSchema?: GraphQLSchema,
  authenticationToken?: (context) => string},
  forwardHeaders?: boolean | Array&lt;string&gt;
})<br/>
remoteSchema({
  name?: string,
  link?: ApolloLink,
  introspectionSchema?: GraphQLSchema,
  authenticationToken?: (context) => string},
  forwardHeaders?: boolean | Array<string>
})</code></pre></h3>

Adds a schema for a remote GraphQL endpoint to the Qewl Application. You can either specify a URL for the endpoint, or pass in an existing `ApolloLink`.
You can optionally pass in an introspectionSchema. If you don't, Qewl will run the introspection query against your endpoint to retrieve the schema.
You can also optionally pass in a function that retrieves the authenticationToken from the GraphQL context. It will be added as Bearer token to the Authorization header for this remote endpoint. For more complex scenarios, use the possibility to pass in your own `ApolloLink` definition.

### `use(path: '...', fn: async (event, next) => {...}`)

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
- **`parent`**, **`args`**, **`context`** and **`info`**. These are the common resolver parameters.
- **`addFields`**. Helper method to add fields to the resolver (see below).

### `resolve(path: string, fn: async (event) => {...}`

Specify a regular resolver for a GraphQL path. This type of resolver is used for fields that are not part of a remote schema. You can only specify one resolver per GraphQL path. The `event` object contains the same properties as above, and also:

<h3><pre><code>resolve(path: string, resolver: {
  fragment?: string
  resolve: async (event) => {...}
  __resolveType?: async (event) => {...}
})</code></pre></h3>

Specify a merge (schema stitching) resolver for a GraphQL path. You can only specify one resolver per GraphQL path. The `event` object contains the same properties as above, and also:
- **`addTypenameField()`**. Helper method. See below
- **`delegate()`**. Helper method to delegate execution to an existing query or mutation (useful for schema stitching). See below
- **`delegateQuery()`**. Helper method to execute a custom query or mutation against your underlying schema (useful for schema stitching). See below

### `await serve({serverOptions})`

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

## Support for other server frameworks

Support for other server frameworks (Hapi, Koa, Restify, Lambda, Micro and Azure Functions) will be released soon!

## Additional middlewares

Additional useful Qewl application and router middlewares (for logging, authentication, mocking, etc.) will be released soon as a separate package!

## Contributing

If you run into any issue using Qewl, or if you have a feature request, please open an [issue](https://github.com/kbrandwijk/qewl/issues/new).
