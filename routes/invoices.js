const express = require('express')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

/** Route for getting all invoices from db */
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query('SELECT id, comp_code FROM invoices')
    return res.status(200).json({ 'invoices': results.rows })
  } catch (err) {
    return next(err)
  }
})

/** Route for adding a new invoice to db */
router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    )
    return res.status(201).json({ 'invoice': result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

/** Route for getting selected company from db by code */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await db.query(
          `SELECT inv.id, 
                  inv.comp_code, 
                  inv.amt, 
                  inv.paid, 
                  inv.add_date, 
                  inv.paid_date, 
                  comp.name, 
                  comp.description 
           FROM invoices AS inv
             INNER JOIN companies AS comp ON (inv.comp_code = comp.code)  
           WHERE id = $1`, [id]
           )
    if (result.rows.length === 0) 
      throw new ExpressError(`Invoice# ${id} not found.`, 404)

    const data = result.rows[0]
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    }
    return res.status(200).json({ 'invoice': invoice })
  } catch (err) {
    return next(err)
  }
})

/** Route for updating company in db */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { amt, paid } = req.body
    
    let paidDate = null

    const invResult = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id])

    if (invResult.rows.length === 0)
      throw new ExpressError(`Invoice# ${id} not found.`, 404)

    const currPD = invResult.rows[0].paid_date

    if (!currPD && paid) {
      paidDate = new Date()
    } else if (!paid) {
      paidDate = null
    } else {
      paidDate = currPD
    }

    const result = await db.query(
      `UPDATE invoices
      SET amt=$1, paid=$2, paid_date=$3
      WHERE id=$4
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    )
    
    return res.status(200).json({ 'invoice': result.rows[0] })
  } catch (err) {
    return next(err)
  }
})

/** Route for updating company in db */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await db.query('DELETE FROM invoices WHERE id = $1', [id])
    if (result.rows.length === 0)
      throw new ExpressError(`Invoice# ${id} not found.`, 404)
    return res.status(200).json({ 'status': 'deleted' })
  } catch (err) {
    return next(err)
  }
})

module.exports = router
