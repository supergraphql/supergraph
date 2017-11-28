import { expect } from 'chai'
import * as sinon from 'sinon'
import { base } from './base'
import { Qewl } from '../Qewl'

describe('base', () => {
    let mw
    let request: any

    beforeEach(function() {
        request = { qewl: undefined }
    })

    describe('Functionality', () => {
        it('should create context.qewl if not part of the context', () => {
            mw = base(sinon.stub())
            // tslint:disable-next-line:no-empty
            mw(request, null, () => {})
            expect(request.qewl).to.not.equal(undefined, 'qewl object not added to the context')
            expect(request.qewl.schemas).to.not.equal(undefined, 'schemas object not added to the qewl context')
            expect(request.qewl.resolvers).to.not.equal(undefined, 'resolvers object not added to the qewl context')
            expect(request.qewl.middlewares).to.not.equal(undefined, 'middlewares object not added to the qewl context')
        })

        it('should use existing context.qewl', () => {
            mw = base(sinon.stub())
            const existingRequest: any = { qewl: new Qewl()}
            existingRequest.qewl.schemas.test = ''
            // tslint:disable-next-line:no-empty
            mw(existingRequest, null, () => {})
            expect(Object.keys(existingRequest.qewl.schemas).length).to.equal(1, 'Existing context is overwritten')
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
            expect(mw).to.be.a('Function', 'Qewl middleware should return a function')
        })

        it('should accept three arguments', () => {
            mw = base(sinon.stub())
            expect(mw.length).to.equal(3, 'Qewl middleware should return a function with 3 arguments')
        })
    })
})
