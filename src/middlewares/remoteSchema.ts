import { GraphQLSchema } from 'graphql'
import { ApolloLink } from 'apollo-link'
import fetch from 'node-fetch'
import { createHttpLink } from 'apollo-link-http'
import { introspectSchema, makeRemoteExecutableSchema } from 'graphql-tools'
import { Request, Response, AsyncRequestHandler, NextFunction } from 'express'
import { base } from './base'
import { merge } from 'lodash'
import { isBoolean } from 'util'

export function remoteSchema({
  name,
  uri,
  introspectionSchema,
  link,
  authenticationToken,
  forwardHeaders = false
}: {
  name?: string
  uri?: string
  introspectionSchema?: GraphQLSchema
  link?: ApolloLink
  authenticationToken?: (req: Request) => string
  forwardHeaders?: boolean | Array<string>
}): AsyncRequestHandler {
  if (!uri && !link) {
    throw new Error('Specify either uri or link to define remote schema')
  }

  return base(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (link === undefined) {
      const httpLink: ApolloLink = createHttpLink({ uri, fetch: fetch as any })

      if (authenticationToken !== undefined) {
        link = new ApolloLink((operation, forward) => {
          operation.setContext((ctx: Request) => {
            let headers: any = {}
            if (ctx && forwardHeaders) {
              if (isBoolean(forwardHeaders)) {
                headers = ctx.headers
              } else {
                forwardHeaders.forEach(h => (headers[h] = ctx.headers[h]))
              }
            }
            if (ctx && authenticationToken) {
              merge(headers, { Authorization: `Bearer ${authenticationToken(ctx)}` })
            }

            return headers
          })
          return forward!(operation)
        }).concat(httpLink)
      } else {
        link = httpLink
      }
    }

    if (introspectionSchema === undefined) {
      introspectionSchema = await introspectSchema(link)
    }

    const executableSchema = makeRemoteExecutableSchema({
      schema: introspectionSchema,
      link
    })

    if (name === undefined) {
      name = `schema${Object.keys(req.qewl.schemas).length}`
    }
    req.qewl.schemas[name] = executableSchema

    next()
  })
}
