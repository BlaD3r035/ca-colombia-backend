const express = require('express')
const router = express.Router()
const db = require('../db/db')

router.get('/getinventory', async (req, res) => {
    const { userId } = req.query;

    try {
        if (!userId) {
            return res.status(400).json({ error: 'No userId provided' });
        }

        
        const [walletRows] = await db.query(
            'SELECT cash, bank FROM wallet WHERE user_id = ?',
            [userId]
        );

        if (walletRows.length === 0) {
            return res.status(404).json({ error: 'No wallet found' });
        }

        const wallet = walletRows[0];

        const [inventoryRows] = await db.query(
            `SELECT 
                ui.item_id, 
                ui.store_item_id, 
                i.*
             FROM user_inventory ui
             LEFT JOIN items i 
               ON ui.store_item_id = i.item_id
             WHERE ui.user_id = ?`,
            [userId]
        );

        const response = {
            money: {
                cash: wallet.cash,
                bank: wallet.bank,
            },
            items: inventoryRows.map(row => ({
                item_id: row.item_id,
                store_item_id: row.store_item_id,
                item_info: row.item_id ? {
                    ...row
                } : null
            })),
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error getting inventory, internal server error' });
    }
});

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
        await db.query('UPDATE wallet SET bank = ?  WHERE user_id = ?', [object.money.bank, userId])
        return res.status(200).json('Inventory updated')
    } catch (error) {
        return res.status(500).json('Error updating inventory. Internal server error')
    }
})
module.exports = router