import { parse } from 'graphql'
import {
  GraphQLResolveInfo,
  DocumentNode,
  OperationDefinitionNode,
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

export const delegateQuery = (event: QewlRouterEvent) => (
  query: string,
  args?: { [key: string]: any }
) => {
  const document: DocumentNode = parse(query)

  const operationDefinition: OperationDefinitionNode = document
    .definitions[0] as OperationDefinitionNode
  const operationType: 'query' | 'mutation' | 'subscription' =
    operationDefinition.operation
  const operationName: string = (operationDefinition.selectionSet.selections[0] as any)
    .name.value
  const fields: [FieldNode] = (operationDefinition.selectionSet.selections[0] as any)
    .selectionSet.selections

  const newInfo: GraphQLResolveInfo = JSON.parse(JSON.stringify(event.info))
  newInfo.fieldNodes[0].selectionSet!.selections = fields

  return event.mergeInfo.delegate(
    operationType,
    operationName,
    args || event.args,
    event.context,
    newInfo
  )
}

export const addTypeNameField = (info: GraphQLResolveInfo): GraphQLResolveInfo => {
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
  event.addTypeNameField = () => (event.info = addTypeNameField(event.info))
}
