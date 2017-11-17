import { Response, NextFunction } from 'express'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql';
import { QewlRouterResolver, QewlRouterEvent } from '../types';

declare module 'express' {
  export interface Request {
    qewl: {
      schemas?: { [name: string]: GraphQLSchema | string};
      resolvers?: Array<{ path: string; resolver: QewlRouterResolver | ((event: QewlRouterEvent) => Promise<any> | any) }>
      middlewares?: Array<{
        path: string
        fn: (
          parent: any,
          args: { [key: string]: any },
          context: { [key: string]: any },
          info: GraphQLResolveInfo,
          next: any
        ) => any
      }>
    }
  }

  export interface AsyncRequestHandler {
    (req: Request, res: Response, next: NextFunction): Promise<any> | any
  }
}
