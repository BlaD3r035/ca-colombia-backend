const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');
require('dotenv').config()

//routes
const serverId = process.env.SERVER_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;


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

module.exports =router