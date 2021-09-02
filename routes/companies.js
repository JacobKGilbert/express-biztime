const express = require('express')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

/** Route for getting all companies from db */
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query('SELECT * FROM companies')
    return res.status(200).json({ 'companies': results.rows })
  } catch (err) {
    return next(err)
  }
})

/** Route for adding a new company to db */
router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body
    const result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description]
    )
    return res.status(201).json({ 'company': result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

/** Route for getting selected company from db by code */
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params
    const compResult = await db.query('SELECT * FROM companies WHERE code = $1', [code])
    const invResult = await db.query('SELECT id FROM invoices WHERE comp_code = $1', [code])

    if (compResult.rows.length === 0)
      throw new ExpressError('Company not found.', 404)

    const company = compResult.rows[0]
    const invoices = invResult.rows

    company.invoices = invoices.map((inv) => inv.id)

    return res.status(200).json({ 'company': company })
  } catch (err) {
    return next(err)
  }
})

/** Route for updating company in db */
router.patch('/:code', async (req, res, next) => {
  try {
    const { code } = req.params
    const { name, description } = req.body
    const result = await db.query(
      `UPDATE companies SET name = $1, description = $2
      WHERE code = $3
      RETURNING code, name, description`,
      [name, description, code]
    )
    if (result.rows.length === 0)
      throw new ExpressError('Company not found, cannot update.', 404)
    return res.status(200).json({ 'company': result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

/** Route for updating company in db */
router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params
    const result = await db.query('DELETE FROM companies WHERE code = $1', [code])
    
    return res.status(200).json({ 'status': 'deleted' })
  } catch (err) {
    return next(err)
  }
})

module.exports = router