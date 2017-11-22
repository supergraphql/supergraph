import { ExpressHandler, graphqlExpress } from 'apollo-server-express'
import { Request, Response, NextFunction } from 'express'
import { generateSchemaImpl } from './generateSchema'
import { QewlServerOptions } from '../types'

export function serve(serverOptions?: QewlServerOptions): ExpressHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await generateSchemaImpl(req)
    return graphqlExpress({
      ...serverOptions,
      schema: req.qewl.schemas.finalSchema || req.qewl.schemas.mergedSchema,
      context: req
    })(req, res, next)
  }
}

