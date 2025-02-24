
async function addTaxesTransaction(userId, type, description, value) {
  try {

    if (!userId || typeof userId !== 'string') {
      throw new Error('El senderId es obligatorio y debe ser un string.');
    }

   
    if (!value || typeof value !== 'number' || value <= 0) {
      throw new Error('El valor (value) es obligatorio, debe ser un número y mayor que cero.');
    }

    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('La razón (reason) es obligatoria y debe ser una cadena de texto no vacía.');
    }

    
    const colombiaDate = new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' });
    const formattedDate = new Date(colombiaDate);

  
    await db.query(
      'INSERT INTO taxes (userId, type, description, value, date) VALUES (?, ?, ?, ?,?)',
      [userId, type, description, value,formattedDate]
    );
    try{
      const [userInventoryResult] = await db.query('SELECT userId, object FROM inventory WHERE userId = ? LIMIT 1', ['1035227795099492353']);
      const inventory = JSON.parse(userInventoryResult[0].object);
      inventory.money.bank += value
      await db.query('UPDATE inventory SET object = ? WHERE userId = ?', [JSON.stringify(inventory),'1035227795099492353']);

      const [userInventory] = await db.query('SELECT object FROM inventory WHERE userId = ? LIMIT 1', [userId]);

      if (userInventory.length === 0) {
        return
      }

      const inventoryuser = JSON.parse(userInventory[0].object);

      inventoryuser.money.bank -= value;
      await db.query('UPDATE inventory SET object = ? WHERE userId = ?', [JSON.stringify(inventoryuser), userId]);




    }catch(err){
      console.log('problema tratando de añadir los fondos de las taxes en la cuenta de la dian')
    }

    
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      console.log('Error de base de datos: campo inválido en la consulta.');
    } else if (err.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      console.log('Error de base de datos: un campo obligatorio no tiene valor.');
    } else {
      console.log('Error guardando la taxes trans: ' + err.message);
    }
  }
}


//MULTA CODE 

const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');

const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');


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
            { name: 'Notificación', value:`https://cacolombia.com/pdfs/multas/${multaId}.pdf`, inline: false }
          ],
          footer: {
            text: '「CA」 Colombia ER:LC',
            icon_url: 'https://media.discordapp.net/attachments/1047946669079134249/1176943871595397172/Nuevo_Logo.png?ex=672e5065&is=672cfee5&hm=dbe7d9c45ba1c184c0224d2f262918d3c5b5ad3a59b3d6532d8e716263c516ec&=&format=webp&quality=lossless&width=379&height=379'
          }
        }
      ]
    };


    await axios.post(discordWebhookUrl, discordMessage);

    await addTaxesTransaction(pedData.userId,ticketData.type,`Pago de ${ticketData.type} por ${ticketData.value}`, parseInt(ticketData.value))

    
    return res.status(200).json({ message: 'Ticket saved successfully', pdfUrl: `/pdfs/multas/${multaId}.pdf` });
  } catch (e) {
    console.log('Error saving data: ', e);
    return res.status(500).json('Problem saving data');
  }
});

module.exports = router;


