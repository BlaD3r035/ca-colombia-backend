/**
 * @swagger
 * /v1/licence:
 *   get:
 *     summary: Get user license information
 *     description: Returns the details of a user's license based on their userId.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user whose license information is requested.
 *     responses:
 *       200:
 *         description: License information retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 436
 *               userId: "1279148508208955463"
 *               exp: "2025-02-02"
 *               type: "B1"
 *               restriction: "None"
 *               status: "Valid"
 *               reason: "N/A"
 *               createdAt: "2025-02-03T00:20:24.000Z"
 *       400:
 *         description: userId not provided
 *         content:
 *           application/json:
 *             example:
 *               message: "no userId provided"
 *       404:
 *         description: No license found for the provided userId
 *         content:
 *           application/json:
 *             example:
 *               message: "no license found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "server error"
 *
 * /v1/changelicence:
 *   post:
 *     summary: Modify user license status
 *     description: Allows changing the status of a user's license by providing their userId, new status, and a reason.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - status
 *               - reason
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user whose license will be modified.
 *               status:
 *                 type: string
 *                 enum: ["Valid", "Suspended", "Cancelled"]
 *                 description: New status of the license.
 *               reason:
 *                 type: string
 *                 description: Reason for the status change.
 *     responses:
 *       200:
 *         description: License updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "License updated successfully"
 *       400:
 *         description: Invalid or missing data
 *         content:
 *           application/json:
 *             examples:
 *               missing_userId:
 *                 value:
 *                   message: "userId not provided"
 *               invalid_status:
 *                 value:
 *                   message: "Invalid status. Use: Valid, Suspended, or Cancelled"
 *               missing_reason:
 *                 value:
 *                   message: "Reason not provided"
 *       404:
 *         description: No license found for the provided userId
 *         content:
 *           application/json:
 *             example:
 *               message: "No license found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 */
const express = require('express')
const router = express.Router()
const db = require('../db/db')

router.get('/licence', async(req,res) =>{
    if(!req.query.userId){
       return  res.status(404).json({message:"no userId provided"})
    }
    userId = req.query.userId
try{
    const [licence] = await db.query('SELECT * FROM licencia WHERE userId = ?',[userId])
    if(licence.length === 0){
     return res.status(404).json({message:"no licence finded"})
    }
    const lc = licence[0]
 
     return res.status(200).json(lc)
}catch(err){
    console.log(err)

   return res.status(500).json({message:"server error"})
}
  
})

router.post('/changelicence', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "No data provided" });
        }

        const { userId, status, reason } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId not provided" });
        }

        const validStatuses = ["Valida", "Suspendida", "Cancelada"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status. Use: Valida, Suspendida, or Cancelada" });
        }

        if (!reason) {
            return res.status(400).json({ message: "Reason not provided" });
        }

        const [licence] = await db.query('SELECT * FROM licencia WHERE userId = ?', [userId]);

        if (licence.length === 0) {
            return res.status(404).json({ message: "No licence found" });
        }

        await db.query('UPDATE licencia SET status = ?, reason = ? WHERE userId = ?', [status, reason, userId]);

        return res.status(200).json({ message: "Licence updated successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});



module.exports = router