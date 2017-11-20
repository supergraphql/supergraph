import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { Qewl } from '../Qewl'



export const base = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any
): AsyncRequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.qewl) {
      req.qewl = new Qewl()
    }

    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
