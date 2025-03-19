const express = require("express")
const router = express.Router()
const db = require('../db/db');

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require("axios")


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/fotos-incautaciones');
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


router.post('/changevehiclestatus',upload.single('photo'), async(req ,res) =>{
    if (!req.session) {
        return res.status(401).json({ message: "No session" });
    }
    const roles = req.session.roles;
        const is_transit = roles.some((role) => role === '1042099715052949535');
        if (!is_transit) {
            return res.status(401).json({ message: "No role" });
        }
    const agentdata = req.session.userdata
    if(!req.body){
        return res.status(400).json({message: "no data send"})
    }
    const data = JSON.parse(req.body.data);
    const platem = data.plate;
    const status = data.status;
    const userId = data.userId
    const photo = req.file;
    const plate = platem.toUpperCase()

    if(!photo){
        return res.status(400).json({message: "no file send"})

    }
    const validStatuses = ["activo", "incautado"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Use: activo or incautado" });
    }
    try{
      const [veh] = await db.query('SELECT id FROM vehiculos WHERE owner =? AND placa = ?',[userId,plate])
        if(veh.length === 0){
            return res.status(404).json({message:"no vehicle finded"})
        }


          const photoPath = path.join(__dirname, `../public/fotos-incautaciones/${veh[0].id}.jpg`);
                fs.renameSync(photo.path, photoPath); 

        await db.query('UPDATE vehiculos SET status =? WHERE placa =?',[status,plate])

        sendLicenceWebhook(veh[0].id,userId, status, plate, agentdata);


        return res.status(200).json({ message: "vehicle status successfully change " });


    }catch(err){
        console.error('Error saving data: ', e);
        return res.status(500).json('Problem saving data');
    }
   


})

//function
async function sendLicenceWebhook(id,userId, status, plate, officer) {
    try {
        const webhookUrl = process.env.RUNT_URL_WEBHOOK; 
        const payload = {
            content: `<@${userId}>`,
            embeds: [
                {
                    title: "🚨 VEHICULO ENCAUTADO 🚨",
                    description: `SE HA INCAUTADO TU VEHICULO, Si deseas operar tu vehiculo de nuevo puedes usar el comando /runt para pagar la incautación y que te den tu vehiculo de nuevo`,
                    color: 16711680,
                    fields: [
                        { name: "Usuario ID", value: `<@${userId}>`, inline: true },
                        { name: "Nuevo Estado", value: status, inline: true },
                        { name: "Placa", value: plate, inline: false },
                        { name: "Agente", value: `<@${officer.userId}> - ${officer.nombreic} ${officer.apellidoic}`, inline: false }
                    ],  
                    timestamp: new Date().toISOString(),
                    image:{url:`https://cacolombia.com/fotos-incautaciones/${id}.jpg`}
                }
            ]
        };
        await axios.post(webhookUrl, payload);
    } catch (error) {
        console.error("Error al enviar el webhook:", error);
    }
}


module.exports = router