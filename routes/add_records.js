

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const puppeteer = require('puppeteer');
const generateHtmlRecord = require('../functions/pdf/record-pdf');
const {randomUUID}  = require('crypto')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/fotos-antecedentes');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'temp-file.jpg');
  },
});

const upload = multer({ storage });

router.post('/sendrecord', upload.single('photo'), async (req, res) => {
    const { ticketData, agentName, pedData } = JSON.parse(req.body.data); 

    const photo = req.file;
    
    if (!ticketData || !agentName || !pedData || !pedData.user_id || !photo) {
        console.log('Error, falta foto o datos');
        return res.status(404).json('Datos o foto no proporcionados');
    }

    try {
        let time = new Date();
        let endTime = new Date();
        let timeInMinutes = parseInt(ticketData.time, 10); 
        endTime.setMinutes(endTime.getMinutes() + timeInMinutes);
        const id = randomUUID()
        const [saveInfo] = await db.query(
          'INSERT INTO arrests (arrest_id,user_id, articles, time, endTime, agent_name) VALUES (?, ?, ?, ?, ?, ?)',
          [id,pedData.user_id, ticketData.record, ticketData.time, endTime, agentName]
        );
        
        const multaId = id; 

        const photoPath = path.join(__dirname, `../public/fotos-antecedentes/${multaId}.jpg`);
        fs.renameSync(photo.path, photoPath); 

        const pdfPath = path.join(__dirname, `../public/pdfs/antecedentes/${multaId}.pdf`);
        if (!fs.existsSync(path.dirname(pdfPath))) {
          fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
        }

        const htmlContent = generateHtmlRecord(ticketData, agentName, pedData);

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--no-zygote'
  ]
        });
       const page = await browser.newPage();

   
       await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

 
        await page.pdf({
            path: pdfPath,
           format: 'A4',
           printBackground: true,
       });

        await browser.close();
    } catch (err) {
        await browser.close();
        console.error('Error generating PDF:', err);
        return res.status(500).json('Problem generating PDF');
    }

        const discordWebhookUrl = process.env.RECORDS_URL_WEBHOOK;
        const discordMessage = {
            content: `<@${pedData.discord_id}>`,
            embeds: [
                {
                    title: 'REGISTRO DE ARRESTO',
                    color: 0x00FF00,
                    thumbnail: { url: pedData.avatarUrl },
                    fields: [
                        { name: 'Arrestado', value: `<@${pedData.discord_id}>`, inline: false },
                        { name: 'Articulos', value: ticketData.record, inline: false },
                        { name: 'Tiempo', value: `${ticketData.time}`, inline: false },
                        { name: 'Notificación', value: `https://app.cacolombia.com/pdfs/antecedentes/${multaId}.pdf`, inline: false }
                    ],
                    image: { url: `https://app.cacolombia.com/fotos-antecedentes/${multaId}.jpg` }, 
                    footer: {
                        text: '「CA」 Colombia ER:LC',
                        icon_url: 'https://media.discordapp.net/attachments/1047946669079134249/1176943871595397172/Nuevo_Logo.png?format=webp&quality=lossless'
                    }
                }
            ]
        };

        await axios.post(discordWebhookUrl, discordMessage);

        return res.status(200).json({ message: 'Record saved successfully', pdfUrl: `/pdfs/antecedentes/${id}.pdf` });
    } catch (e) {
        console.error('Error saving data: ', e);
        return res.status(500).json('Problem saving data');
    }
});

module.exports = router;
