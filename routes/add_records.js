const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const multer = require('multer');


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
    
    if (!ticketData || !agentName || !pedData || !pedData.userId || !photo) {
       
        console.log('Error, falta foto o datos');
        return res.status(404).json('Datos o foto no proporcionados');
    }

    try {
        let time = new Date();
        let endTime = new Date();
        let timeInMinutes = parseInt(ticketData.time, 10); 
        endTime.setMinutes(endTime.getMinutes() + timeInMinutes);

        // Guardar en la base de datos
        const [saveInfo] = await db.query(
          'INSERT INTO antecedentes (userId, articulos, tiempo, endTime, agente) VALUES (?, ?, ?, ?, ?)',
          [pedData.userId, ticketData.record, ticketData.time, endTime, agentName]
        );
        
        const multaId = saveInfo.insertId; 

        const photoPath = path.join(__dirname, `../public/fotos-antecedentes/${multaId}.jpg`);
        fs.renameSync(photo.path, photoPath); 

        const pdfPath = path.join(__dirname, `../public/pdfs/antecedentes/${multaId}.pdf`);
        if (!fs.existsSync(path.dirname(pdfPath))) {
          fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
        }

        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdfPath));

        doc.fontSize(20).text('REGISTRO ANTECEDENTES PENALES Y REQUERIMIENTOS JUDICIALES', { align: 'center' });
        doc.moveDown().fontSize(14).text(`Respetado(a) señor(a) ${pedData.nombreic} ${pedData.apellidoic}`);
        doc.moveDown().text(`La Entidad encargada de generar el reporte penal le informa: Que siendo ${time} Se ha generado un reporte penal por: ${ticketData.record}.`);
        doc.moveDown().fontSize(14).text('Información del Ciudadano:', { underline: true });
        doc.fontSize(12).text(`- Documento de identidad: ${pedData.documentId}`);
        doc.text(`- Nombre: ${pedData.nombreic} ${pedData.apellidoic}`);
        doc.text(`- Fecha de nacimiento: ${pedData.fechadenacimiento}`);
        doc.moveDown().fontSize(14).text('Información del Agente:', { underline: true });
        doc.fontSize(12).text(`- Nombre del Agente: ${agentName}`);
        doc.moveDown().fontSize(14).text('Información del proceso:', { underline: true });
        doc.text(`- Fecha del Registro: ${new Date().toLocaleDateString()}`);
        doc.text(`- Motivo: ${ticketData.record}`);
        doc.text(`- Tipo de proceso: Registro de Encarcelamiento`);
        doc.text(`- Tiempo: ${ticketData.time} meses desde la generación de este documento`);
        
     

        doc.moveDown().fontSize(14).text('Esta consulta es válida siempre y cuando el número de identificación y nombres, correspondan con el documento de identidad registrado y solo aplica para el territorio colombiano de acuerdo a lo establecido en el ordenamiento constitucional.', { align: 'center' });
        doc.moveDown().fontSize(14).text('Este documento se puede usar como material probatorio para demostrar la validez del registro penal de antecedentes.', { align: 'center' });
        
        doc.moveDown().text('Foto del Registro:', { align: 'center' });
        doc.image(photoPath, { fit: [250, 300], align: 'center' });
        doc.end();

        const discordWebhookUrl = 'https://discord.com/api/webhooks/1304544112086745089/R_A2gPPTSwnB5alDkk4kyW_c7QLYVli4bDymnbaPlK2JsTjeqcWrx4JY1ifQiNEF8M64';
        const discordMessage = {
            content: `<@${pedData.userId}>`,
            embeds: [
                {
                    title: 'REGISTRO DE ARRESTO',
                    color: 0x00FF00,
                    thumbnail: { url: pedData.avatarUrl },
                    fields: [
                        { name: 'Arrestado', value: `<@${pedData.userId}>`, inline: false },
                        { name: 'Articulos', value: ticketData.record, inline: false },
                        { name: 'Tiempo', value: `${ticketData.time}`, inline: false },
                        { name: 'Notificación', value: `https://cacolombia.website/pdfs/antecedentes/${multaId}.pdf`, inline: false }
                    ],
                    image: { url: `https://cacolombia.website/fotos-antecedentes/${multaId}.jpg` }, 
                    footer: {
                        text: '「CA」 Colombia ER:LC',
                        icon_url: 'https://media.discordapp.net/attachments/1047946669079134249/1176943871595397172/Nuevo_Logo.png?format=webp&quality=lossless'
                    }
                }
            ]
        };

        await axios.post(discordWebhookUrl, discordMessage);

        // Responder con la URL del PDF
        return res.status(200).json({ message: 'Record saved successfully', pdfUrl: `/pdfs/antecedentes/${multaId}.pdf` });
    } catch (e) {
        console.error('Error saving data: ', e);
        return res.status(500).json('Problem saving data');
    }
});

module.exports = router;