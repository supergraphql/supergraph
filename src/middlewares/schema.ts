import { GraphQLSchema } from 'graphql'
import { Request, Response, AsyncRequestHandler, NextFunction } from 'express'
import { base } from './base'

export function schema(
  def: { name?: string; schema: GraphQLSchema | string } | GraphQLSchema | string
): AsyncRequestHandler {
  return base((req: Request, res: Response, next: NextFunction): any => {

    if (typeof def === 'string' || def instanceof GraphQLSchema) {
      def = { schema: def }
    }

    if (!def.name) {
      def.name = `schema${Object.keys(req.qewl.schemas).length}`
    }

    req.qewl.schemas[def.name] = def.schema

    next()
  })
}
