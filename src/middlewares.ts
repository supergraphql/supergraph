import { makeRemoteExecutableSchema, introspectSchema } from 'graphql-tools'
import { GraphQLSchema } from 'graphql'
import { ApolloLink } from 'apollo-link'
import { createHttpLink } from 'apollo-link-http'
import fetch from 'node-fetch'
import { QewlMiddlewareHandler, QewlContext } from './types'

export function schema(
  def: { name?: string; schema: GraphQLSchema | string } | string
): QewlMiddlewareHandler {
  return async context => {
    let name: string | undefined
    let schemaDef: GraphQLSchema | string
    if (typeof def === 'string') {
      name = `schema${Object.keys(context.schemas).length}`
      schemaDef = def
    } else {
      name = def.name
      if (def.name === undefined) {
        name = `schema${Object.keys(context.schemas).length}`
      }
      schemaDef = def.schema
    }
    context.schemas[name!] = schemaDef
  }
}

export function remoteSchema({
  name,
  uri,
  introspectionSchema,
  link,
  authenticationToken
}: {
  name?: string
  uri?: string
  introspectionSchema?: GraphQLSchema
  link?: ApolloLink
  authenticationToken?: (context: QewlContext) => string
}) {
  if (!uri && !link) {
    throw new Error('Specify either uri or link to define remote schema')
  }

  return async (context: QewlContext) => {
    if (link === undefined) {
      const httpLink: ApolloLink = createHttpLink({ uri, fetch: fetch as any })

      if (authenticationToken !== undefined) {
        link = new ApolloLink((operation, forward) => {
          operation.setContext((ctx: QewlContext) => {
            if (context && authenticationToken(ctx)) {
              return {
                headers: {
                  Authorization: `Bearer ${authenticationToken(ctx)}`
                }
              }
            } else {
              return null
            }
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
      name = `schema${Object.keys(context.schemas).length}`
    }
    context.schemas[name] = executableSchema
  }
}
