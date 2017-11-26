import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { base } from './base'
import { parse, TypeDefinitionNode, GraphQLSchema } from 'graphql'
import { get, put } from 'memory-cache'
import { mergeSchemas } from 'graphql-tools'

export function transform(finalSchema: string): AsyncRequestHandler {
  return base((req: Request, res: Response, next: NextFunction): any => {
    req.qewl.on('schemaGenerated', generatedSchema => {
      if (!get('qewl.finalSchema')) {
        const doc = parse(finalSchema)

        // Merge, taking the definitions from the final schema.
        // Unfortunately, this breaks resolvers (https://github.com/apollographql/graphql-tools/issues/504)
        // And it doesn't apply onTypeConflict on the entire Query/Mutation types, just to individual fields
        const schemaDef: GraphQLSchema = mergeSchemas({
          schemas: [req.qewl.schemas.mergedSchema, finalSchema],
          onTypeConflict: (l, r) => r
        }) as GraphQLSchema

        // Restore the resolvers for the query type, or remove it or any of its fields if not part of the final schema
        const queryType = schemaDef.getQueryType()
        if (queryType) {
          if (!doc.definitions.map(d => (d as TypeDefinitionNode).name.value).includes(queryType.name)) {
            delete (schemaDef as any)._queryType
          } else {
            const queryFields = queryType.getFields()
            const queryFieldKeys = Object.keys(queryFields)
            const newQueryTypeFields = (doc.definitions.find(
              d => (d as TypeDefinitionNode).name.value === queryType.name
            ) as any).fields.map((f: any) => f.name.value)
            for (const key of queryFieldKeys) {
              if (newQueryTypeFields.includes(key)) {
                queryFields[key].resolve = req.qewl.schemas.mergedSchema.getQueryType().getFields()[
                  key
                ].resolve
              } else {
                delete schemaDef.getQueryType().getFields()[key]
              }
            }
          }
        }

        // Restore the resolvers for the mutation type, or remove it or any of its fields if not part of the final schema
        const mutationType = schemaDef.getMutationType()
        if (mutationType) {
          if (!doc.definitions.map(d => (d as TypeDefinitionNode).name.value).includes(mutationType.name)) {
            delete (schemaDef as any)._mutationType
          } else {
            const mutationFields = mutationType.getFields()
            const mutationFieldKeys = Object.keys(mutationFields)
            const newMutationTypeFields = (doc.definitions.find(
              d => (d as TypeDefinitionNode).name.value === mutationType.name
            ) as any).fields.map((f: any) => f.name.value)
            for (const key of mutationFieldKeys) {
              if (newMutationTypeFields.includes(key)) {
                mutationFields[key].resolve = req.qewl.schemas.mergedSchema.getMutationType().getFields()[
                  key
                ].resolve
              } else {
                delete schemaDef.getMutationType().getFields()[key]
              }
            }
          }
        }

        // Restore the resolvers for the subscription type, or remove it or any of its fields if not part of the final schema
        const subscriptionType = schemaDef.getSubscriptionType()
        if (subscriptionType) {
          if (
            !doc.definitions.map(d => (d as TypeDefinitionNode).name.value).includes(subscriptionType.name)
          ) {
            delete (schemaDef as any)._subscriptionType
          } else {
            const subscriptionFields = subscriptionType.getFields()
            const subscriptionFieldKeys = Object.keys(subscriptionFields)
            const newSubscriptionTypeFields = (doc.definitions.find(
              d => (d as TypeDefinitionNode).name.value === subscriptionType.name
            ) as any).fields.map((f: any) => f.name.value)
            for (const key of subscriptionFieldKeys) {
              if (newSubscriptionTypeFields.includes(key)) {
                subscriptionFields[
                  key
                ].resolve = req.qewl.schemas.mergedSchema.getSubscriptionType().getFields()[key].resolve
              } else {
                delete schemaDef.getSubscriptionType().getFields()[key]
              }
            }
          }
        }

        req.qewl.schemas.finalSchema = schemaDef
        put(`qewl.finalSchema`, schemaDef)
      } else {
        req.qewl.schemas.finalSchema = get(`qewl.finalSchema`)
      }
    })

    next()
  })
}
