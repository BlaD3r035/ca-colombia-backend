const express = require('express')
const router = express.Router()
const db = require('../db/db')

router.get('/getinventory', async (req, res) => {
    const { userId } = req.query
    try{
        if (!userId) {
            return res.status(400).json('No userId provided')
        }
        const [inventory] = await db.query('SELECT * FROM inventory WHERE userId = ?', [userId])
        if (inventory.length === 0) {
            return res.status(404).json('No inventory found')
        }
        const parceinventory = JSON.parse(inventory[0].object)
        return res.status(200).json(parceinventory)
    }catch(error){
        return res.status(500).json('Error getting inventory, internal server error')
    }
   
})

router.put('/editinventory', async (req, res) => {
    if(!req.body) {
        return res.status(400).json('No data provided')
    }
    const { userId, object } = req.body
    if(typeof userId !== 'string') {
        return res.status(400).json('userId must be an string')
    }
    if (!userId || !object) {
        return res.status(400).json('No userId or object provided')
    }
    try {
        await db.query('UPDATE inventory SET object = ? WHERE userId = ?', [JSON.stringify(object), userId])
        return res.status(200).json('Inventory updated')
    } catch (error) {
        return res.status(500).json('Error updating inventory. Internal server error')
    }
})
module.exports = router