const express = require('express')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

router.get('/', async (req, res, next) => {
  try {
    const industries = []
      const results = await db.query(
        `SELECT i.code AS ind_code, i.industry, c.code AS comp_code
        FROM industries AS i
        LEFT JOIN companies_industries AS ci
          ON i.code = ci.ind_code
        LEFT JOIN companies AS c
          ON ci.comp_code = comp_code`
      )
      for (let i = 0; i < results.rows.length; i++) {
        const { ind_code, industry, comp_code } = results.rows[i];
        const selInd = {
          code: ind_code,
          industry: industry,
          companies: []
        }
        if (!industries.includes(selInd)) {
          industries.push(selInd)
        }
        
      }
    
      const companies = result.rows.map((i) => i.comp_code)
      if (companies[0] !== null) {
        selInd.companies = companies
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