import { Request, Response, NextFunction, AsyncRequestHandler } from 'express'
import { base } from './base'
import {
  INTERFACE_TYPE_DEFINITION,
  OBJECT_TYPE_DEFINITION,
  ENUM_TYPE_DEFINITION,
  UNION_TYPE_DEFINITION,
  INPUT_OBJECT_TYPE_DEFINITION
} from 'graphql/language/kinds'
import {
  parse,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLFieldMap,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLInputFieldMap,
  TypeDefinitionNode,
  GraphQLSchema
} from 'graphql'
import { remove, cloneDeep } from 'lodash'
import { get, put } from 'memory-cache'

export function transform(finalSchema: string): AsyncRequestHandler {
  return base((req: Request, res: Response, next: NextFunction): any => {
    req.qewl.on('schemaGenerated', generatedSchema => {
      if (!get('qewl.finalSchema')) {
        const doc = parse(finalSchema)
        const schemaDef: GraphQLSchema = cloneDeep(req.qewl.schemas.mergedSchema)
        for (const definition of doc.definitions) {
          const name = (definition as TypeDefinitionNode).name.value
          const typeMapEntry: any = schemaDef.getTypeMap()[name]
          if (!typeMapEntry) {
            continue
          }

          let fieldNames: Array<string> = []
          let fields: any
          let keysFn: any
          let deleteFn: (coll: any, item: string) => void = (coll, item) => {
            /* */
          }
          switch (definition.kind) {
            case OBJECT_TYPE_DEFINITION:
            case INTERFACE_TYPE_DEFINITION:
              fieldNames = definition.fields.map(f => f.name.value)
              fields = (typeMapEntry as GraphQLObjectType | GraphQLInterfaceType).getFields()
              keysFn = (x: GraphQLFieldMap<any, any>) => Object.keys(x)
              deleteFn = (coll: GraphQLFieldMap<any, any>, item) => delete coll[item]
              break
            case ENUM_TYPE_DEFINITION:
              fieldNames = definition.values.map(f => f.name.value)
              fields = (typeMapEntry as GraphQLEnumType).getValues()
              keysFn = (x: GraphQLEnumValue[]) => x.map(f => f.name)
              deleteFn = (coll: GraphQLEnumValue[], item) =>
                remove(coll, (f: GraphQLEnumValue) => f.name === item)
              break
            case UNION_TYPE_DEFINITION:
              fieldNames = definition.types.map(f => f.name.value)
              fields = (typeMapEntry as GraphQLUnionType).getTypes()
              keysFn = (x: GraphQLObjectType[]) => x.map(f => f.name)
              deleteFn = (coll: GraphQLObjectType[], item) => remove(coll, f => f.name === item)
              break
            case INPUT_OBJECT_TYPE_DEFINITION:
              fieldNames = definition.fields.map(f => f.name.value)
              fields = (typeMapEntry as GraphQLInputObjectType).getFields()
              keysFn = (x: GraphQLInputFieldMap) => Object.keys(x)
              deleteFn = (coll: GraphQLInputFieldMap, item) => delete coll[item]
              break
            default:
              throw new Error(`Unsupported definition type found in schema: '${definition.kind}'`)
          }

          for (const field of keysFn(fields)) {
            if (!fieldNames.includes(field)) {
              deleteFn(fields, field)
            }
          }
        }

        const mutationType = schemaDef.getMutationType().name
        if (!doc.definitions.map(d => (d as TypeDefinitionNode).name.value).includes(mutationType)) {
          delete (schemaDef as any)._mutationType
        }

        const queryType = schemaDef.getQueryType().name
        if (!doc.definitions.map(d => (d as TypeDefinitionNode).name.value).includes(queryType)) {
          delete (schemaDef as any)._queryType
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
