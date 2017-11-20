import { Response, NextFunction } from 'express'
import { Qewl } from '../Qewl';

declare module 'express' {
  export interface Request {
    qewl: Qewl
  }

  export interface AsyncRequestHandler {
    (req: Request, res: Response, next: NextFunction): Promise<any> | any
  }
}
