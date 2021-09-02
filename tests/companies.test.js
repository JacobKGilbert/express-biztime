process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

const APPLE = {
  code: 'apl',
  name: 'Apple',
  description: 'iPhone maker'
}
const appleWithInvoice = {
  code: 'apl',
  name: 'Apple',
  description: 'iPhone maker',
  invoices: []
}
const IBM = {
  code: 'ibm',
  name: 'IBM',
  description: 'Data cloud company'
}
let testComp

beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [APPLE.code, APPLE.name, APPLE.description]
  )
  testComp = result.rows[0]
})

afterEach(async () => {
  await db.query('DELETE FROM companies')
})

afterAll(async () => {
  await db.end()
})

describe('GET /companies', () => {
  test('Get all companies', async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ companies: [testComp] })
  })
})

describe('POST /companies', () => {
  test('Post new company to db', async () => {
    const res = await request(app).post('/companies').send(IBM)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ company: IBM  })
  })
})

describe('GET /companies/:code', () => {
  test('Get select company', async () => {
    const res = await request(app).get(`/companies/${APPLE.code}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ company: appleWithInvoice })
  })
  test('Returns 404 if item is not found', async () => {
    const res = await request(app).get('/companies/msft')
    expect(res.statusCode).toBe(404)
  })
})