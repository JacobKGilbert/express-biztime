const express = require('express')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.code AS ind_code, i.industry, c.code AS comp_code
      FROM industries AS i
      LEFT JOIN companies_industries AS ci
        ON i.code = ci.ind_code
      LEFT JOIN companies AS c
        ON ci.comp_code = comp_code`
    )
    const industries = []
    for (let i = 0; i < results.rows.length; i++) {
      const { ind_code, industry, comp_code } = results.rows[i]
      // Find whether industries array already has given industry object.
      const found = industries.find(({ code }) => code === ind_code)
      // If not found then add, Else simply push comp_code.
      if (!found) {
        const newInd = {
          code: ind_code,
          industry: industry,
          companies: []
        }
        if (comp_code !== null) {
          newInd.companies.push(comp_code)
        }
        industries.push(newInd)
      } else {
        if (comp_code !== null) {
          found.companies.push(comp_code)
        }
      }
    }
    return res.status(200).json({ industries: industries })
  } catch (err) {
    console.log(err)
    return next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { code, industry } = req.body
    const result = await db.query(
    `INSERT INTO industries (code, industry)
      VALUES ($1, $2)
      RETURNING code, industry`,
    [code, industry]
    )
    return res.status(201).json({ industry: result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

router.post('/:code', async (req, res, next) => {
  try {
    const indCode = req.params.code
    const compCode = req.body.code
    const result = await db.query(
      `INSERT INTO companies_industries (comp_code, ind_code)
      VALUES ($1, $2)
      RETURNING comp_code, ind_code`,
      [compCode, indCode]
    )
    return res.status(201).json({ 'associated': result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

module.exports = router