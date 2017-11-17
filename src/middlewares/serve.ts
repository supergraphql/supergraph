import { ExpressHandler, graphqlExpress } from 'apollo-server-express'
import { GraphQLServerOptions } from 'apollo-server-core/dist/graphqlOptions'
import { Request, Response, NextFunction } from 'express'
import { mergeSchemas } from 'graphql-tools'
import { merge, set } from 'lodash'
import { addMiddleware } from 'graphql-add-middleware'
import { QewlRouterResolver, QewlRouterEvent } from '../types'
import { addHelpers } from '../helpers'
import { GraphQLResolveInfo } from 'graphql/type/definition'
import { GraphQLSchema } from 'graphql/type/schema';

export function serve(serverOptions?: GraphQLServerOptions): ExpressHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Apply middlewares for every request, because they depend on context
    // for (const middleware of req.qewl.middlewares) {
    //   await middleware(req)
    // }

    if (Object.keys(req.qewl.schemas).length === 0) {
      throw new Error('No schemas defined')
    }

    // Only construct schema once
    if (!req.qewl.schemas.mergedSchema) {
      // Apply router resolvers
      const resolvers = (mergeInfo: any) => {
        const resolverBlocks: Array<any> = req.qewl.resolvers.map(resolver =>
          generateResolverBlock(mergeInfo, resolver)
        )

        const resolverObject = {}
        merge(resolverObject, ...resolverBlocks)
        return resolverObject
      }

      // MergeSchemas
      const schemasToMerge = Object.keys(req.qewl.schemas).map(
        key => req.qewl.schemas[key]
      )

      req.qewl.schemas.mergedSchema = mergeSchemas({
        schemas: schemasToMerge,
        resolvers
      })

      // Apply router middlewares
      for (const middleware of req.qewl.middlewares) {
        addMiddleware(req.qewl.schemas.mergedSchema, middleware.path, middleware.fn)
      }
    }
    return graphqlExpress({
      ...serverOptions,
      schema: req.qewl.schemas.mergedSchema as GraphQLSchema,
      context: req
    })(req, res, next)
  }
}

function generateResolverBlock(
  mergeInfo: any,
  resolver: { path: string; resolver: QewlRouterResolver | ((event: QewlRouterEvent) => Promise<any> | any) }
): Promise<any> {
  // Create object from path -> apparently, can also use _.set and _.get here :D
  let resolverObject: any = {}

  let resolveFn: any

  if (typeof resolver.resolver === 'function') {
    // This is a 'normal' resolver function
    resolveFn = wrap(resolver.resolver, mergeInfo)
  } else {
    resolveFn = { ...resolver.resolver, resolve: wrap(resolver.resolver.resolve, mergeInfo) }
  }

  set(resolverObject, resolver.path, resolveFn)

  return resolverObject
}

function wrap(fn: ((event: QewlRouterEvent) => Promise<any> | any), mergeInfo: any) {
  return async (
    parent: any,
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ) => {
    const event: any = { parent, args, context, info, mergeInfo: mergeInfo }
    addHelpers(event)
    return await fn(event)
  }
}
