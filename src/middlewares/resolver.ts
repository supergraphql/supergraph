import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { base } from './base'
import { QewlRouterResolver, QewlRouterEvent } from '../types'

// Todo: also support function for path
export function resolver(
  path: string,
  resolve: QewlRouterResolver | ((event: QewlRouterEvent) => Promise<any> | any)
): AsyncRequestHandler {
  return base(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Guard
    if (req.qewl.resolvers.some(r => r.path === path)) {
      throw new Error(`${path}: You can only specify one resolver for a path`)
    }

    req.qewl.resolvers.push({ path, resolver: resolve })

    next()
  })
}
