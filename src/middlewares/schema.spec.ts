import { schema } from './schema'
import { expect } from 'chai'

describe('schema', () => {
    it('should return a function', () => {
        const mw = schema({schema: ''})
        expect(mw).to.be.a('Function')
    })
})
