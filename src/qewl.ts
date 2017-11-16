import { graphqlExpress, ExpressHandler } from 'apollo-server-express'
import { GraphQLSchema, GraphQLResolveInfo } from 'graphql'
import { mergeSchemas } from 'graphql-tools'
import { ApolloLink } from 'apollo-link'
import { Request, Response } from 'express'
import { merge, set } from 'lodash'
import { addMiddleware } from 'graphql-add-middleware'

import { QewlRouter } from './router'
import {
  schema as schemaMiddleware,
  remoteSchema as remoteSchemaMiddleware
} from './middlewares'
import {
  QewlMiddlewareHandler,
  QewlContext,
  QewlRuntimeContext,
  QewlRouterResolver
} from './types'
import { addHelpers } from './helpers'
import { GraphQLServerOptions } from 'apollo-server-core/dist/graphqlOptions'

export class Qewl {
  public router: QewlRouter

  private context: QewlContext = { schemas: {} }
  private middlewares: Array<QewlMiddlewareHandler> = []
  private mergedSchema: GraphQLSchema

  constructor() {
    this.router = new QewlRouter()
  }

  public use = (fn: QewlMiddlewareHandler): Qewl => {
    this.middlewares.push(fn)
    return this
  }

  // Shortcut for use(schema(...))
  public schema = (
    schema: { name?: string; schema: GraphQLSchema | string } | string
  ): Qewl => {
    if (typeof schema === 'string') {
      schema = { schema }
    }
    this.use(schemaMiddleware({ name: schema.name, schema: schema.schema }))
    return this
  }

  // Shortcut for use(remoteSchema(...))
  public remoteSchema = ({
    name,
    uri,
    introspectionSchema,
    link,
    authenticationToken
  }: {
    name?: string
    uri?: string
    introspectionSchema?: GraphQLSchema
    link?: ApolloLink
    authenticationToken?: (context: { [key: string]: any }) => string
  }): Qewl => {
    this.use(
      remoteSchemaMiddleware({
        name,
        uri,
        introspectionSchema,
        link,
        authenticationToken
      })
    )
    return this
  }

  public middleware = (serverOptions?: GraphQLServerOptions): ExpressHandler => {
    return async (req: Request, res: Response, next): Promise<void> => {
      this.context.req = req
      this.context.res = res

      // Apply middlewares for every request, because they depend on context
      for (const middleware of this.middlewares) {
        await middleware(this.context as QewlRuntimeContext)
      }

      if (Object.keys(this.context.schemas).length === 0) {
        throw new Error('No schemas defined')
      }

      // Only construct schema once
      if (!this.mergedSchema) {
        // Apply router resolvers
        const resolvers = (mergeInfo: any) => {
          const resolverBlocks: Array<any> = this.router.resolvers.map(resolver =>
            generateResolverBlock(mergeInfo, resolver)
          )

          const resolverObject = {}
          merge(resolverObject, ...resolverBlocks)
          return resolverObject
        }

        // MergeSchemas
        const schemasToMerge = Object.keys(this.context.schemas).map(
          key => this.context.schemas[key]
        )

        this.mergedSchema = mergeSchemas({
          schemas: schemasToMerge,
          resolvers
        })

        // Apply router middlewares
        for (const middleware of this.router.middlewares) {
          addMiddleware(this.mergedSchema, middleware.path, middleware.fn)
        }
      }
      return graphqlExpress({
        ...serverOptions,
        schema: this.mergedSchema,
        context: this.context
      })(req, res, next)
    }
  }
}

function generateResolverBlock(
  mergeInfo: any,
  resolver: { path: string; resolver: QewlRouterResolver }
): Promise<any> {
  // Create object from path -> apparently, can also use _.set and _.get here :D
  let resolverObject: any = {}
  let resolve: any = {}

  let resolveFn: QewlRouterResolver = resolver.resolver

  resolve.fragment = resolveFn.fragment
  resolve.resolve = async (
    parent: any,
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ) => {
    const event: any = { parent, args, context, info, mergeInfo: mergeInfo }
    addHelpers(event)
    return await resolveFn.resolve(event)
  }
  resolve.__isTypeOf = resolveFn.__isTypeOf
  resolve.__resolveType = resolveFn.__resolveType

  set(resolverObject, resolver.path, resolve)

  return resolverObject
}
