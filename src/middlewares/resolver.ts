import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { base } from './base'
import { SuperGraphRouterResolver, SuperGraphRouterEvent } from '../types'

// Todo: also support function for path
export function resolver(
  path: string,
  resolve: SuperGraphRouterResolver | ((event: SuperGraphRouterEvent) => Promise<any> | any)
): AsyncRequestHandler {
  return base(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Guard
    if (req.supergraph.resolvers.some(r => r.path === path)) {
      throw new Error(`${path}: You can only specify one resolver for a path`)
    }

    req.supergraph.resolvers.push({ path, resolver: resolve })

    next()
  })
}

export function resolvers(def: {
  [key: string]: {
    [key: string]: SuperGraphRouterResolver | ((event: SuperGraphRouterEvent) => Promise<any> | any)
  }
}): AsyncRequestHandler {
  return base(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Guard
    for (const parent of Object.keys(def)) {
      for (const field of Object.keys(def[parent])) {
        const path = `${parent}.${field}`
        if (req.supergraph.resolvers.some(r => r.path === path)) {
          throw new Error(`${path}: You can only specify one resolver for a path`)
        }

        req.supergraph.resolvers.push({ path, resolver: def[parent][field] })
      }
    }

    next()
  })
}
