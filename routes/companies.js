const express = require('express')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')
const { route } = require('../app')
const { arrowFunctionExpression } = require('@babel/types')

/** Route for getting all companies from db */
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query('SELECT * FROM companies')
    return res.status(200).json({ companies: results.rows })
  } catch (err) {
    return next(err)
  }
})

/** Route for getting selected company from db by code */
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params
    const results = await db.query('SELECT * FROM companies WHERE code = $1', [code])
    if (results.rows.length === 0) throw new ExpressError('Company not found', 404)
    return res.status(200).json({ company: results.rows[0] })
  } catch (err) {
    return next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body
    const result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description])
    return res.status(201).json({ company: result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

module.exports = router