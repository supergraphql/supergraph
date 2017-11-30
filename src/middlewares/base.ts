import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { SuperGraph } from '../SuperGraph'



export const base = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any
): AsyncRequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.supergraph) {
      req.supergraph = new SuperGraph()
    }

    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
