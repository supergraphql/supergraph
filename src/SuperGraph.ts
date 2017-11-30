import { EventEmitter } from 'events'
import { GraphQLSchema, GraphQLResolveInfo } from 'graphql'
import { SuperGraphRouterResolver, SuperGraphRouterEvent } from './types'

export class SuperGraph extends EventEmitter {
  public schemas: { mergedSchema?: GraphQLSchema, finalSchema?: GraphQLSchema, [name: string]: GraphQLSchema | string } = {}

  public resolvers: Array<{
    path: string
    resolver: SuperGraphRouterResolver | ((event: SuperGraphRouterEvent) => Promise<any> | any)
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
