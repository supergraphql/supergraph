import { Response, NextFunction } from 'express'
import { SuperGraph } from '../SuperGraph';

declare module 'express' {
  export interface Request {
    supergraph: SuperGraph
  }

  export interface AsyncRequestHandler {
    (req: Request, res: Response, next: NextFunction): Promise<any> | any
  }
}
