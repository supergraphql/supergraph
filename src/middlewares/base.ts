import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { merge } from 'lodash'

export const base = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any
): AsyncRequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    req.qewl = merge({ schemas: {}, resolvers: [], middlewares: [] }, req.qewl)

    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
