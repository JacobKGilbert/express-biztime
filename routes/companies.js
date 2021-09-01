const express = require('express')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

router.get('/', async (req, res) => {
  const results = await db.query('SELECT * FROM companies')
  return res.status(200).json({ companies: results.rows })
})

module.exports = router