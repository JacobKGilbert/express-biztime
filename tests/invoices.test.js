process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

const APPLE = {
  code: 'apl',
  name: 'Apple',
  description: 'iPhone maker'
}
const INVOICE = {
  comp_code: 'apl',
  amt: 200.00,
}

let testComp
let testInv

beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [APPLE.code, APPLE.name, APPLE.description]
  )
  const invResult = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [INVOICE.comp_code, INVOICE.amt]
  )

  testComp = compResult.rows[0]
  testInv = invResult.rows[0]
})

afterEach(async () => {
  await db.query('DELETE FROM companies')
  await db.query('DELETE FROM invoices')
})

afterAll(async () => {
  await db.end()
})

describe('GET /invoices', () => {
  test('Get all invoices', async () => {
    const res = await request(app).get('/invoices')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ invoices: [{id: testInv.id, comp_code: testInv.comp_code}] })
  })
})

describe('POST /invoices', () => {
  test('Post new invoice to db', async () => {
    const newInv = { comp_code:testComp.code, amt: 300.00 }
    const res = await request(app).post('/invoices').send(newInv)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ 
      invoice: {
        id: expect.any(Number),
        comp_code: newInv.comp_code,
        amt: newInv.amt,
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }
    })
  })
})

describe('GET /invoices/:id', () => {
  test('Get select invoice', async () => {
    const res = await request(app).get(`/invoices/${testInv.id}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      invoice: {
        id: testInv.id,
        amt: testInv.amt,
        paid: testInv.paid,
        add_date: expect.any(String),
        paid_date: testInv.paid_date,
        company: {
          code: testComp.code,
          name: testComp.name,
          description: testComp.description,
        }
      }
    })
  })
  test('Returns 404 if invoice is not found', async () => {
    const res = await request(app).get('/invoices/0')
    expect(res.statusCode).toBe(404)
  })
})

describe('PUT /invoices/:id', () => {
  test('Update select invoice', async () => {
    const updatedInv = { amt: 100.00, paid: true }
    const res = await request(app)
      .put(`/invoices/${testInv.id}`)
      .send(updatedInv)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      invoice: {
        id: testInv.id,
        comp_code: testInv.comp_code,
        amt: updatedInv.amt,
        paid: updatedInv.paid,
        add_date: expect.any(String),
        paid_date: expect.any(String),
      }
    })
  })
  test('Returns 404 if invoice is not found', async () => {
    const updatedInv = { amt: 200.0, paid: true }
    const res = await request(app).patch(`/invoices/0`).send(updatedInv)
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /invoices/:id', () => {
  test('Delete select invoice', async () => {
    const res = await request(app).delete(`/invoices/${testInv.id}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'deleted' })
  })
})