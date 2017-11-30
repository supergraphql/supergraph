import { expect } from 'chai'
import * as sinon from 'sinon'
import { base } from './base'
import { SuperGraph } from '../SuperGraph'

describe('base', () => {
    let mw
    let request: any

    beforeEach(function() {
        request = { supergraph: undefined }
    })

    describe('Functionality', () => {
        it('should create context.supergraph if not part of the context', () => {
            mw = base(sinon.stub())
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(request.supergraph).to.not.equal(undefined, 'supergraph object not added to the context')
            expect(request.supergraph.schemas).to.not.equal(undefined, 'schemas object not added to the supergraph context')
            expect(request.supergraph.resolvers).to.not.equal(undefined, 'resolvers object not added to the supergraph context')
            expect(request.supergraph.middlewares).to.not.equal(undefined, 'middlewares object not added to the supergraph context')
        })

        it('should use existing context.supergraph', () => {
            mw = base(sinon.stub())
            const existingRequest: any = { supergraph: new SuperGraph()}
            existingRequest.supergraph.schemas.test = ''
            // tslint:disable-next-line:no-empty
            mw(existingRequest, null, () => {})
            expect(Object.keys(existingRequest.supergraph.schemas).length).to.equal(1, 'Existing context is overwritten')
        })

        it('should pass any error to next', () => {
            const error = new Error()
            mw = base(sinon.stub().throws(error))
            const next = sinon.spy()
            mw(request, null, next)
            expect(next.calledWith(error), 'Error not propagated to next()')
        })
    })

    describe('Express middleware function', () => {
        it('should return a function', () => {
            mw = base(sinon.stub())
            expect(mw).to.be.a('Function', 'SuperGraph middleware should return a function')
        })

        it('should accept three arguments', () => {
            mw = base(sinon.stub())
            expect(mw.length).to.equal(3, 'SuperGraph middleware should return a function with 3 arguments')
        })
    })
})
