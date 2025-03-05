/**
 * @swagger
 * /v1/user:
 *   get:
 *     summary: Get user by document ID
 *     parameters:
 *       - name: documentId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID of the user
 *     responses:
 *       200:
 *         description: Returns user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 userId:
 *                   type: string
 *                 username:
 *                   type: string
 *                 nombreic:
 *                   type: string
 *                 apellidoic:
 *                   type: string
 *                 edadic:
 *                   type: string
 *                 estaturaic:
 *                   type: string
 *                 sexoic:
 *                   type: string
 *                 tipodesangre:
 *                   type: string
 *                 nacionalidadic:
 *                   type: string
 *                 fechadenacimiento:
 *                   type: string
 *                 userroblox:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 documentId:
 *                   type: integer
 *             example:
 *               id: 1
 *               userId: "718088843043143921"
 *               username: "russianforce_284248"
 *               nombreic: "API-TEST-name"
 *               apellidoic: "API-TEST-lastname"
 *               edadic: "1"
 *               estaturaic: "1"
 *               sexoic: "hombre"
 *               tipodesangre: "b+"
 *               nacionalidadic: "global"
 *               fechadenacimiento: "11/11/1111"
 *               userroblox: "BlaD3r035"
 *               avatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-F07FDDB696EFB419606535D63AFC0BE2-Png/420/420/AvatarHeadshot/Png/noFilter"
 *               documentId: 1
 *       404:
 *         description: No user found
 * /v1/plate:
 *   get:
 *     summary: Get vehicle owner by plate number
 *     parameters:
 *       - name: plate
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle plate number
 *     responses:
 *       200:
 *         description: Returns vehicle owner data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 owner:
 *                   type: string
 *             example:
 *               owner: "718088843043143921"
 *       404:
 *         description: No plate found
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get user by document ID
router.get('/user', async (req, res) => {
    try {
        const documentId = req.query.documentId;
        if (!documentId) {
            return res.status(400).json({ error: 'No user documentId provided' });
        }

        const [userId] = await db.query('SELECT * FROM cedulas WHERE documentId = ?', [documentId]);
        if (userId.length === 0) {
            return res.status(404).json({ error: 'No user found' });
        }
        return res.json(userId[0]);
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get vehicle owner by plate number
router.get('/plate', async (req, res) => {
    try {
        const plate = req.query.plate;
        if (!plate) {
            return res.status(400).json({ error: 'No plate number provided' });
        }

        const [userId] = await db.query('SELECT owner FROM vehiculos WHERE placa = ?', [plate]);
        if (userId.length === 0) {
            return res.status(404).json({ error: 'No plate found' });
        }
        return res.status(200).json(userId[0]);
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;