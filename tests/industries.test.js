process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

const APPLE = {
  code: 'apl',
  name: 'Apple',
  description: 'iPhone maker'
}
const INDUSTRY = {
  code: 'comp',
  industry: 'computer'
}
const ACCT_IND = {
  code: 'acct',
  industry: 'accounting'
}

let testComp
let testInd
let secTestInd

beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
    [APPLE.code, APPLE.name, APPLE.description]
  )
  const indResult = await db.query(
    `INSERT INTO industries (code, industry)
      VALUES ($1, $2)
      RETURNING code, industry`,
    [INDUSTRY.code, INDUSTRY.industry]
  )
  const secIndRes = await db.query(
    `INSERT INTO industries (code, industry)
      VALUES ($1, $2)
      RETURNING code, industry`,
      [ACCT_IND.code, ACCT_IND.industry]
  )
  const compIndResult = await db.query(
    `INSERT INTO companies_industries (comp_code, ind_code)
    VALUES ($1, $2)
    RETURNING comp_code, ind_code`,
    [APPLE.code, INDUSTRY.code]
  )

  testComp = compResult.rows[0]
  testInd = indResult.rows[0]
  secTestInd = secIndRes.rows[0]
})

afterEach(async () => {
  await db.query('DELETE FROM companies')
  await db.query('DELETE FROM industries')
  await db.query('DELETE FROM companies_industries')
})

afterAll(async () => {
  await db.end()
})

describe('GET /industries', () => {
  test('Get all industries', async () => {
    const res = await request(app).get('/industries')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ 
      industries: [
        {
          code: testInd.code,
          industry: testInd.industry,
          companies: [testComp.code]
        },
        {
          code: secTestInd.code,
          industry: secTestInd.industry,
          companies: []
        }]
    })
  })
})

describe('POST /industries', () => {
  test('POST new industry', async () => {
    const newInd = { code: 'data', industry: 'Data'}
    const res = await request(app).post('/industries').send(newInd)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ industry: newInd })
  })
})

describe('POST /industries/:code', () => {
  test('POST to connect industry to company', async () => {
    const res = await request(app).post(`/industries/${secTestInd.code}`).send({ code: testComp.code })
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ 'associated': {
      comp_code: testComp.code,
      ind_code: secTestInd.code
    }})
  })
})