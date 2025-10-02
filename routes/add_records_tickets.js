

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
const fs = require('fs')
const path = require('path');
const puppeteer = require('puppeteer');
const generateHtmlTicket = require('../functions/pdf/ticket-pdf');

router.post('/sendticket', async (req, res) => {
  const { ticketData, agentName, pedData } = req.body;


  if (!ticketData || !agentName || !pedData || !pedData.user_id) {
    return res.status(404).json('No data provided');
  }

  try {
 
    const [saveInfo] = await db.query(
      'INSERT INTO infractions (user_id, type, articles, plate, fine, agent_name, impounds,suspends) VALUES (?, ?, ?, ?, ?, ?,?,?)',
      [pedData.user_id, ticketData.type, ticketData.record, ticketData.plate, ticketData.value, agentName, 0,0]
    );

    const multaId = saveInfo.insertId; 
    const pdfPath = path.join(__dirname, `../public/pdfs/multas/${multaId}.pdf`);
    const htmlContent = generateHtmlTicket(ticketData, agentName, pedData);

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

  const discordWebhookUrl = process.env.TICKETS_URL_WEBHOOK;
  const discordMessage = {
    content: `<@${pedData.discord_id}>`,
    embeds: [
      {
        title: ticketData.type === 'multa' ? 'REGISTRO MULTA' : 'COMPARENDO',
        color: ticketData.type === 'multa' ? 0x00ff00 : 0xffff00,
        thumbnail: { url: pedData.avatarUrl },
        fields: [
          { name: 'Multado', value: `<@${pedData.discord_id}>`, inline: false },
          { name: 'Articulos', value: ticketData.record, inline: false },
          { name: 'Valor', value: `$${ticketData.value}`, inline: false },
          { name: 'Placa', value: ticketData.plate, inline: false },
          { name: 'Notificación', value: `https://app.cacolombia.com/pdfs/multas/${multaId}.pdf`, inline: false },
        ],
        footer: {
          text: '「CA」 Colombia ER:LC',
          icon_url:
            'https://media.discordapp.net/attachments/1047946669079134249/1176943871595397172/Nuevo_Logo.png?ex=672e5065&is=672cfee5&hm=dbe7d9c45ba1c184c0224d2f262918d3c5b5ad3a59b3d6532d8e716263c516ec&=&format=webp&quality=lossless&width=379&height=379',
        },
      },
    ],
  };
      try{
        await db.query('UPDATE wallet SET bank = (bank - ?) WHERE user_id = ?',[ticketData.value,pedData.user_id])

      }catch(e){
        console.log("Error debiting ticket value: " + e)
      }
      await axios.post(discordWebhookUrl, discordMessage);
  
      /*await addTaxesTransaction(pedData.userId,ticketData.type,`Pago de ${ticketData.type} por ${ticketData.value}`, parseInt(ticketData.value)) */
      
      
      return res.status(200).json({ message: 'Ticket saved successfully', pdfUrl: `/pdfs/multas/${multaId}.pdf` });

   
    
  
   
  } catch (e) {
    console.log('Error saving data: ', e);
    return res.status(500).json('Problem saving data');
  }
});

module.exports = router;


