import { ExpressHandler, graphqlExpress } from 'apollo-server-express'
import { Request, Response, NextFunction } from 'express'
import { generateSchemaImpl } from './generateSchema'
import { SuperGraphServerOptions } from '../types'

export function serve(serverOptions?: SuperGraphServerOptions): ExpressHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await generateSchemaImpl(req)
    return graphqlExpress({
      ...serverOptions,
      schema: req.supergraph.schemas.finalSchema || req.supergraph.schemas.mergedSchema,
      context: req
    })(req, res, next)
  }
}

