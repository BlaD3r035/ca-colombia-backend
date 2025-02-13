const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const axios = require('axios');

const webhookdiscord = 'https://discord.com/api/webhooks/1082094635171729438/4nKs-4ssqr87JV1sj9HHIlZQt-rYqKKDhMOCmI9_1OVgAy8cQDSayzkWeTjYechsmx6G';

async function sendWebhook(denuncia) {
    const embed = {
        title: "📢 Nueva denuncia registrada",
        color: 32767, 
        fields: [
            { name: "**Descripción**", value: denuncia.description, inline: false },
            { name: " **Fecha del incidente**", value: denuncia.dateEchos, inline: true },
            { name: " **Hora del incidente**", value: denuncia.hour, inline: true },
            { name: " **Lugar**", value: denuncia.place, inline: false },
            { name: " **Descripción del lugar**", value: denuncia.descriptionPlace, inline: false },
            { name: " **Medio del delito**", value: denuncia.medium, inline: false },
            { name: " **Denunciante**", value: denuncia.name, inline: true },
            { name: " **Identificación del denunciante**", value: denuncia.documentId, inline: true },
            { name: " **¿El denunciante es víctima?**", value: denuncia.victim, inline: true },
            { name: " **¿hay otras victimas involucradas con el delito? **", value: denuncia.otherVictim, inline: false },
            { name: " **Informacion del victimario**", value: denuncia.victimizerInfo, inline: false },
            { name: " **¿Hay testigos?**", value: denuncia.witnesses, inline: false }
        ],
        footer: { text: "📌 Esta denuncia fue registrada automáticamente" },
        timestamp: new Date()
    };

    try {
        await axios.post(webhookdiscord, { embeds: [embed] });
        console.log("✅ Webhook enviado correctamente.");
    } catch (error) {
        console.error("❌ Error enviando el webhook:", error);
    }
}
router.post('/createdenuncia', async (req, res) => {
    try {
        if (req.body == undefined) {
            return res.status(400).json({ message: 'No data provided' });
        }

        const {
            name, documentId, dateEchos, hour, description, medium, place, 
            descriptionPlace, victim, otherVictim, victimizerInfo, witnesses
        } = req.body;

        const fields = { name, documentId, dateEchos, hour, description, medium, place, descriptionPlace, victim, otherVictim, victimizerInfo, witnesses };
        for (const [key, value] of Object.entries(fields)) {
            if (value === undefined || value === null || value === '') {
                return res.status(400).json({ message: `Missing required field: ${key}` });
            }
        }

        if (typeof name !== 'string' ||
            typeof documentId !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dateEchos) ||
            !/^\d{2}:\d{2}(:\d{2})?$/.test(hour) ||  
            typeof description !== 'string' ||
            typeof medium !== 'string' ||
            typeof place !== 'string' ||
            typeof descriptionPlace !== 'string' ||
            typeof victim !== 'string' ||
            typeof otherVictim !== 'string' ||
            typeof victimizerInfo !== 'string' ||
            typeof witnesses !== 'string'
        ) {
            return res.status(400).json({ message: 'Invalid data types' });
        }

        await db.query('INSERT INTO denuncias (name,documentId,dateEchos,hour,description,medium,place,descriptionPlace,victim,otherVictim,victimizerInfo,witnesses) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[name, documentId, dateEchos, hour, description, medium, place, descriptionPlace, victim, otherVictim, victimizerInfo, witnesses ])

        await sendWebhook(req.body);
        return res.status(201).json({ message: 'Denuncia created successfully' });

    } catch (err) {
        return res.status(500).json({ message: 'Error saving denuncia' });
        
    }
});

module.exports = router;
