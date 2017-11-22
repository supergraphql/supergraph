import { graphql } from 'graphql'
import {
  GraphQLResolveInfo,
  FieldNode
} from 'graphql'
import { QewlRouterEvent } from './types'

export const delegate = (event: QewlRouterEvent) => (
  operationType: 'query' | 'mutation' | 'subscription',
  operationName: string,
  args?: any
) => {
  return event.mergeInfo.delegate(
    operationType,
    operationName,
    args || event.args,
    event.context,
    event.info
  )
}

export const delegateQuery = (event: QewlRouterEvent) => async (
  query: string,
  vars?: { [key: string]: any }
) => {

  const result = await graphql(event.context.qewl.schemas.mergedSchema, query, null, null, vars)
  return result.data[0]
}

export const addTypenameField = (info: GraphQLResolveInfo): GraphQLResolveInfo => {
  const field: FieldNode = {
    kind: 'Field',
    name: { kind: 'Name', value: '__typename' }
  }

  return addFields(info, [field])
}

export const addFields = (
  info: GraphQLResolveInfo,
  fields: [FieldNode | string] | FieldNode | string
) => {
  const newInfo: GraphQLResolveInfo = JSON.parse(JSON.stringify(info))

  if (!(fields instanceof Array)) {
    fields = [fields]
  }

  for (const field of fields) {
    if (typeof field === 'string') {
      newInfo.fieldNodes[0].selectionSet!.selections.push({
        kind: 'Field',
        name: { kind: 'Name', value: field }
      })
    } else {
      newInfo.fieldNodes[0].selectionSet!.selections.push(field)
    }
  }

  return newInfo
}

export const addHelpers = (event: QewlRouterEvent) => {
  event.delegate = delegate(event)
  event.delegateQuery = delegateQuery(event)
  event.addFields = (fields: [FieldNode | string] | FieldNode | string) =>
    (event.info = addFields(event.info, fields))
  event.addTypenameField = () => (event.info = addTypenameField(event.info))
}
