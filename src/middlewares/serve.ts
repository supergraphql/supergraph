import { ExpressHandler, graphqlExpress } from 'apollo-server-express'
import { GraphQLServerOptions } from 'apollo-server-core/dist/graphqlOptions'
import { Request, Response, NextFunction } from 'express'
import { generateSchemaImpl } from './generateSchema'

export function serve(serverOptions?: GraphQLServerOptions): ExpressHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await generateSchemaImpl(req)
    return graphqlExpress({
      ...serverOptions,
      schema: req.qewl.schemas.mergedSchema,
      context: req
    })(req, res, next)
  }
}

