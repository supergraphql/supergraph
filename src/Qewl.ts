import { EventEmitter } from 'events'
import { GraphQLSchema, GraphQLResolveInfo } from 'graphql'
import { QewlRouterResolver, QewlRouterEvent } from './types'

export class Qewl extends EventEmitter {
  public schemas: { mergedSchema?: GraphQLSchema, finalSchema?: GraphQLSchema, [name: string]: GraphQLSchema | string } = {}

  public resolvers: Array<{
    path: string
    resolver: QewlRouterResolver | ((event: QewlRouterEvent) => Promise<any> | any)
  }> = []

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
}
