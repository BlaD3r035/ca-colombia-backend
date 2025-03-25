/**
 * @swagger
 * /v1/avatar/{userId}:
 *   get:
 *     summary: Get Roblox avatar
 *     description: Retrieves the headshot avatar of a Roblox user by their user ID.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Roblox user ID.
 *     responses:
 *       302:
 *         description: Redirects to the user's avatar image.
 *       404:
 *         description: Avatar not found.
 *       500:
 *         description: Error fetching avatar.
 */

/**
 * @swagger
 * /v1/miembros:
 *   get:
 *     summary: Get Discord server member count
 *     description: Retrieves the approximate member count of a Discord server.
 *     responses:
 *       200:
 *         description: Successfully retrieved the member count.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMembers:
 *                   type: integer
 *                   example: 150
 *       500:
 *         description: Error fetching server members.
 */



const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');

//routes
const serverId = process.env.SERVER_DISCORD_ID;
const botToken =process.env.BOT_TOKEN;


router.get('/avatar/:userId', async (req, res) => {
    const userId = req.params.userId;
    const thumbnailUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false&thumbnailType=HeadShot`;

    try {
        const response = await axios.get(thumbnailUrl);
        if (response.data && response.data.data && response.data.data.length > 0) {
            const imageUrl = response.data.data[0].imageUrl;
            res.redirect(imageUrl);
        } else {
            console.error(`No avatar found for user ID: ${userId}`);
            res.status(404).send('Avatar not found');
        }
    } catch (error) {
        console.error(`Error fetching avatar: ${error.message}`);
        res.status(500).send('Error fetching avatar');
    }
});

router.get('/miembros', async (req, res) => {
    try {
        const response = await axios.get(`https://discord.com/api/v10/guilds/${serverId}?with_counts=true`, {
            headers: {
                Authorization: `Bot ${botToken}`
            }
        });

        if (response.data) {
            const numeroMiembros = response.data.approximate_member_count;
            res.json({ totalMembers: numeroMiembros });
        } else {
            console.error('Error al obtener los datos del servidor');
            res.status(500).json({ error: 'No se encontraron datos del servidor' });
        }
    } catch (error) {
        console.error(`Error al obtener miembros del servidor: ${error.message}`);
        res.status(500).json({ error: 'Error al obtener los miembros del servidor' });
    }
});

router.get('/eventos', async (req,res) =>{
    try{
        const [eventos] = await db.query('SELECT * FROM eventos WHERE date > NOW()')
        if(!eventos || eventos.length === 0){
            return res.status(404).json({message:"No events founded"})
        }
        return res.status(200).json({eventos:eventos})

    }catch(e){
       console.log(e)
       return res.status(500).json({message:"internal server error"})
    }
})

module.exports =router