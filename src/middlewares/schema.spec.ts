import { schema } from './schema'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { makeExecutableSchema } from 'graphql-tools'

describe('schema', () => {
    let mw
    let request: any

    beforeEach(function() {
        request = { qewl: undefined }
    })

    describe('Express middleware function', () => {
        it('should return a function', () => {
            mw = schema({schema: ''})
            expect(mw).to.be.a('Function', 'Qewl middleware should return a function')
        })

        it('should accept three arguments', () => {
            mw = schema({schema: ''})
            expect(mw.length).to.equal(3, 'Qewl middleware should return a function with 3 arguments')
        })

        it('should call next() once', function() {
            mw = schema({schema: ''})
            const nextSpy = sinon.spy()

            mw(request, null, nextSpy)
            expect(nextSpy.calledOnce).to.equal(true, 'next() is not called')
        })
    })

    describe('Functionality', () => {
        it('should use the passed in name as key in the context', () => {
            mw = schema({name: 'Test', schema: 'type Query { dummy: String }'})
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(Object.keys(request.qewl.schemas)).to.contain('Test', 'Schema not added with passed in name')
        })


        it('should add a schema passed in as string to the context', () => {
            mw = schema('type Query { dummy: String }')
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(Object.keys(request.qewl.schemas).length).to.equal(1, 'Schema not added to context')
        })

        it('should add a schema passed in as an object with string to the context', () => {
            mw = schema({schema: 'type Query { dummy: String }'})
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(Object.keys(request.qewl.schemas).length).to.equal(1, 'Schema not added to context')
        })

        it('should add a schema passed in as GraphQLSchema to the context', () => {
            mw = schema(makeExecutableSchema({ typeDefs: 'type Query { dummy: String }'}))
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(Object.keys(request.qewl.schemas).length).to.equal(1, 'Schema not added to context')
        })

        it('should add a schema passed in as an object with GraphQLSchema to the context', () => {
            mw = schema({schema: makeExecutableSchema({ typeDefs: 'type Query { dummy: String }'})})
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(Object.keys(request.qewl.schemas).length).to.equal(1, 'Schema not added to context')
        })
    })
})
