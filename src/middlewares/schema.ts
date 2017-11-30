import { GraphQLSchema } from 'graphql'
import { Request, Response, AsyncRequestHandler, NextFunction } from 'express'
import { base } from './base'
import { makeExecutableSchema } from 'graphql-tools'

export function schema(
  def: { name?: string; schema: GraphQLSchema | string } | GraphQLSchema | string
): AsyncRequestHandler {
  return base((req: Request, res: Response, next: NextFunction): any => {
    if (typeof def === 'string' || def instanceof GraphQLSchema) {
      def = { schema: def }
    }

    if (!def.name) {
      def.name = `schema${Object.keys(req.supergraph.schemas).length}`
    }

    if (typeof def.schema === 'string') {
      try {
        const actualSchema = makeExecutableSchema({typeDefs: def.schema})
        def.schema = actualSchema
      } catch (e) {}
    }

    req.supergraph.schemas[def.name] = def.schema

    next()
  })
}
