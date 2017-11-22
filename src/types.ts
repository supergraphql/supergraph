import {
  GraphQLSchema,
  GraphQLTypeResolver,
  GraphQLIsTypeOfFn,
  GraphQLResolveInfo,
  FieldNode,
  ValidationContext,
  GraphQLFieldResolver
} from 'graphql'
import { Request } from 'express'
import { LogFunction } from 'apollo-server-core'

export interface QewlMiddlewareHandler {
  (context: Request): void
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
  delegateQuery: (query: string, vars?: { [key: string]: any }) => any
  addTypeNameField: () => void
  addFields: (fields: [FieldNode | string] | FieldNode | string) => void

  [key: string]: any
}

export interface QewlServerOptions {
  formatError?: Function
  rootValue?: any
  logFunction?: LogFunction
  formatParams?: Function
  validationRules?: Array<(context: ValidationContext) => any>
  formatResponse?: Function
  fieldResolver?: GraphQLFieldResolver<any, any>
  debug?: boolean
  tracing?: boolean
  cacheControl?: boolean
}
