import { QewlRouterMiddlewareHandler, QewlRouterResolver, QewlRouterEvent } from './types'
import { addHelpers } from './helpers'
import { GraphQLResolveInfo } from 'graphql'

export class QewlRouter {
  public middlewares: Array<{
    path: string
    fn: (
      parent: any,
      args: { [key: string]: any },
      context: { [key: string]: any },
      info: GraphQLResolveInfo,
      next: any
    ) => any
  }> = []
  public resolvers: Array<{ path: string; resolver: QewlRouterResolver }> = []

  public use = (path: string, fn: QewlRouterMiddlewareHandler): QewlRouter => {
    // wrap the function
    const middlewareFunction = async (
      parent: any,
      args: { [key: string]: any },
      context: { [key: string]: any },
      info: GraphQLResolveInfo,
      next: any
    ) => {
      const event: any = { parent, args, context, info }
      addHelpers(event)
      return await fn(event, next)
    }
    this.middlewares.push({ path, fn: middlewareFunction })
    return this
  }

  // Todo: also support function for path
  public resolve = (
    path: string,
    resolver: QewlRouterResolver | ((event: QewlRouterEvent) => Promise<any> | any)
  ): QewlRouter => {
    // Guard
    if (this.resolvers.some(r => r.path === path)) {
      throw new Error(`${path}: You can only specify one resolver for a path`)
    }

    if (resolver instanceof Function) {
      resolver = { resolve: resolver }
    }

    this.resolvers.push({ path, resolver })
    return this
  }
}
