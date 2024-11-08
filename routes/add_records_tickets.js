const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');
const { Client } = require('unb-api');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const client = new Client('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiIxMjU5Njc3OTIzMzQ3MTM3NzQ4IiwiaWF0IjoxNzIwNDAxNTYxfQ.0mjjTZTrGQZ7X9dOdmRO4o1kI5FtRllZaPDrK26qGvY');


router.post('/sendticket', async (req, res) => {
  const { ticketData, agentName, pedData } = req.body;

  if (!ticketData || !agentName || !pedData || !pedData.userId) {
    return res.status(404).json('No data provided');
  }

  try {
 
    const [saveInfo] = await db.query(
      'INSERT INTO multas (userId, tipo, articulos, placa, valor, agente) VALUES (?, ?, ?, ?, ?, ?)',
      [pedData.userId, ticketData.type, ticketData.record, ticketData.plate, ticketData.value, agentName]
    );

    const multaId = saveInfo.insertId; 
    const pdfPath = path.join(__dirname, `../public/pdfs/multas/${multaId}.pdf`);

    if (!fs.existsSync(path.dirname(pdfPath))) {
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    }

    
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

   
    doc.fontSize(20).text('REGISTRO DE MULTA/COMPARENDO CIUDADANO', { align: 'center' });

   
    doc.moveDown().fontSize(14).text(`Respetado(a) señor(a) ${pedData.nombreic} ${pedData.apellidoic}`);
    doc.moveDown().text(`La Secretaría Distrital de Movilidad le informa que, en cumplimiento del
procedimiento establecido en el artículo 135 de la Ley 769 de 2002 modificado por el Artículo 22 de la Ley 1383 de 2010, le fue realizada la siguiente orden de comparendo por ${ticketData.record}.`);

   
    doc.moveDown().fontSize(14).text('Información del Ciudadano:', { underline: true });
    doc.fontSize(12).text(`- Documento de identidad: ${pedData.documentId}`);
    doc.text(`- Nombre: ${pedData.nombreic} ${pedData.apellidoic}`);
    doc.text(`- Fecha de nacimiento: ${pedData.fechadenacimiento}`);
    doc.text(`- Placa del Vehículo (si aplica): ${ticketData.plate || 'N/A'}`);

    
    doc.moveDown().fontSize(14).text('Información del Agente:', { underline: true });
    doc.fontSize(12).text(`- Nombre del Agente: ${agentName}`);
    

    doc.moveDown().fontSize(14).text('Información del proceso:', { underline: true });
    doc.text(`- Fecha del Registro: ${new Date().toLocaleDateString()}`);
    doc.text(`- Motivo: ${ticketData.record}`);
    doc.text(`- Tipo de proceso: ${ticketData.type}`);
    doc.text(`- valor total: ${ticketData.value}`);

   
    doc.moveDown().fontSize(14).text('Estado de Pago:', { underline: true });
    doc.fontSize(12).text('- Estado: Pagado');

   
    doc.moveDown().fontSize(14).text('Este documento se puede usar como material probatorio para la demostración de validez de este proceso. DITRA CALI.', { align: 'center' });

    
    doc.end();

  
    const discordWebhookUrl = 'https://discord.com/api/webhooks/1266611079627280468/jcWBFH7mx8Ur5reL588kfm0e505TTMyudxcpyZH5jFG8qIs-ygHwy6vz3c53balaznTd';
    const discordMessage = {
        content:`<@${pedData.userId}>`,
      embeds: [
        {
          title: ticketData.type === 'multa' ? 'REGISTRO MULTA' : 'COMPARENDO',
          color: ticketData.type === 'multa' ? 0x00FF00 : 0xFFFF00,
          thumbnail: { url: pedData.avatarUrl },
          fields: [
            { name: 'Multado', value: `<@${pedData.userId}>`, inline: false },
            { name: 'Articulos', value: ticketData.record, inline: false },
            { name: 'Valor', value: `$${ticketData.value}`, inline: false },
            { name: 'Placa', value: ticketData.plate, inline: false },
            { name: 'Notificación', value:`https://cacolombia.website/pdfs/multas/${multaId}.pdf`, inline: false }
          ],
          footer: {
            text: '「CA」 Colombia ER:LC',
            icon_url: 'https://media.discordapp.net/attachments/1047946669079134249/1176943871595397172/Nuevo_Logo.png?ex=672e5065&is=672cfee5&hm=dbe7d9c45ba1c184c0224d2f262918d3c5b5ad3a59b3d6532d8e716263c516ec&=&format=webp&quality=lossless&width=379&height=379'
          }
        }
      ]
    };

    await axios.post(discordWebhookUrl, discordMessage);

    // Modificar balance de usuario
    const guildID = '1042099714608345159';
    const userID = pedData.userId;
    try {
      await client.editUserBalance(guildID, userID, { cash: -ticketData.value });
      await client.editUserBalance(guildID, "721510528215679058", { cash: +ticketData.value });
    } catch (error) {
      console.error('Error al descontar el dinero', error);
      return res.status(500).json('No se pudo descontar el dinero del usuario');
    }

    // Responder con la URL del PDF
    return res.status(200).json({ message: 'Ticket saved successfully', pdfUrl: `/pdfs/multas/${multaId}.pdf` });
  } catch (e) {
    console.error('Error saving data: ', e);
    return res.status(500).json('Problem saving data');
  }
});

module.exports = router;
