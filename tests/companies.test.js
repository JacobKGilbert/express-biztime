process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

const APPLE = {
  code: 'apl',
  name: 'Apple',
  description: 'iPhone maker'
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
    expect(res.body).toEqual({ company: testComp })
  })
  test('Returns 404 if company is not found', async () => {
    const res = await request(app).get('/companies/msft')
    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /companies/:code', () => {
  test('Update select company', async () => {
    const updatedApple = { name: 'Apple', description: 'M1 Mac designer' }
    const res = await request(app)
      .patch(`/companies/${APPLE.code}`)
      .send(updatedApple)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ company: {
      code: APPLE.code,
      name: updatedApple.name,
      description: updatedApple.description
    } })
  })
  test('Returns 404 if company is not found', async () => {
    const updatedMicrosoft = { name: 'Microsoft', description: 'Somewhat of a competitor' }
    const res = await request(app).patch(`/companies/msft`).send(updatedMicrosoft)
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /companies/:code', () => {
  test('Delete select company', async () => {
    const res = await request(app).delete(`/companies/${APPLE.code}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'deleted' })
  })
})