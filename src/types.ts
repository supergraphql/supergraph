import {
  GraphQLSchema,
  GraphQLTypeResolver,
  GraphQLIsTypeOfFn,
  GraphQLResolveInfo,
  FieldNode
} from 'graphql'
import { Request } from 'express'

export interface QewlMiddlewareHandler {
  (context: QewlRuntimeContext): void
}

export interface QewlRuntimeContext {
  schemas: { [key: string]: GraphQLSchema | string }
  req: Request
  [key: string]: any
}

export interface QewlContext {
  schemas: { [key: string]: GraphQLSchema | string }
  req?: Request
  [key: string]: any
}

export interface QewlRouterMiddlewareHandler {
  (event: QewlRouterEvent, next: any): Promise<any> | any
}

export interface QewlRouterResolver {
  fragment?: string
  resolve: (event: QewlRouterEvent) => Promise<any> | any
  __resolveType?: GraphQLTypeResolver<any, any>
  __isTypeOf?: GraphQLIsTypeOfFn<any, any>
}

export interface QewlRouterEvent {
  parent: any
  args: { [key: string]: any }
  context: { [key: string]: any }
  info: GraphQLResolveInfo
  delegate: (
    operationType: 'query' | 'mutation' | 'subscription',
    operationName: string,
    args?: any
  ) => any
  delegateQuery: (query: string, args?: { [key: string]: any }) => any
  addTypeNameField: () => void
  addFields: (fields: [FieldNode | string] | FieldNode | string) => void

  [key: string]: any
}
