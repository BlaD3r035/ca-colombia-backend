const express= require('express')
const router = express.Router()
const db = require('../../db/db');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const BOT_TOKEN = process.env.BOT_TOKEN
const WEBHOOK_URL = process.env.RUNT_URL_WEBHOOK
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
discordClient.login(BOT_TOKEN);


router.patch('/changevehiclestatus', async(req ,res) =>{
    if(!req.body){
        return res.status(400).json({message: "no data send"})
    }
    const {plate,status,userId} = req.body

    if(!plate || !status || !userId){
        return res.status(400).json({message: "missing data"})
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

        await db.query('UPDATE vehiculos SET status =? WHERE placa =?',[status,plate])

        return res.status(200).json({ message: "vehicle status successfully change " });

    }catch(err){
        console.error('Error saving data: ', e);
        return res.status(500).json('Problem saving data');
    }
   

})

router.post('/addvehicle', async(req,res)=>{
    if(!req.body){
        return res.status(400).json({message: "no data send"})
    }
    const {userId,plate,model,color} = req.body

    if(!userId || !plate || !model || !color){
        return res.status(400).json({message: "missing data"})
    }
    try{
        const [exist] = await db.query('SELECT id FROM vehiculos WHERE placa = ?',[plate])
        if(exist.length > 0){
            return res.status(400).json({message: "vehicle already exist"})
        }

        await db.query('INSERT INTO vehiculos (placa,color,nombre,owner) VALUES (?,?,?,?)',[plate,color,model,userId])
        return res.status(200).json({message: "vehicle added successfully"})
    }catch(e){
        console.error('Error saving data: ', e);
        return res.status(500).json('Problem saving data');
    }
})
router.post('/addlicence', async(req,res)=>{
    if(!req.body){
        return res.status(400).json({message: "no data send"})
    }
    const {userId,restrictions} = req.body

    if(!userId || !restrictions){
        return res.status(400).json({message: "missing data"})
    }
    try{
        const [licenciaResults] = await db.query('SELECT userId FROM licencia WHERE userId = ? LIMIT 1', [userId]);

        if (licenciaResults.length > 0) {
            return res.status(400).json({ message: "User already has a license" });
        }
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };

        const now = new Date();
        const createdAt = formatDateTime(now); 
        now.setMonth(now.getMonth() + 2);
        const removeAt = formatDateTime(now); 

        const restriction = restrictions|| ""
        await db.query(
            'INSERT INTO licencia (userId, exp, restriccion, removeAt) VALUES (?,?,?,?)', 
            [userId, createdAt, restriction, removeAt]
        );
        return res.status(200).json({ message: "License added successfully" });
    }catch(e){
        console.error('Error saving data: ', e);
        return res.status(500).json('Problem saving data');
    }
})
router.delete('/deletevehicle', async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: "No data sent" });
    }

    const { plate, userId } = req.body;

    if (!userId || !plate) {
        return res.status(400).json({ message: "Missing data" });
    }

    try {
        const [vehicleData] = await db.query('SELECT nombre FROM vehiculos  WHERE placa = ? AND owner = ?',[plate, userId])
        const [result] = await db.query('DELETE FROM vehiculos WHERE placa = ? AND owner = ?', [plate, userId]);

        if (result.affectedRows > 0) {
            const vehiculo = vehicleData[0].nombre
            if(vehiculo.status && vehiculo.status === "incautado"){
                return res.status(401).json({message:"No se puede transferir el vehiculo si está incautado "})
    
            }
            const [itemData] = await db.query('SELECT * FROM items WHERE name = ?',[vehiculo])
            if(itemData.length > 0){
                const itemInfo = itemData[0]
                const [invResult] = await db.query('SELECT object FROM inventory WHERE userId =?',[userId])
                if(invResult.length > 0){
                 const inventory= JSON.parse(invResult[0].object)
                 const existingItem = inventory.items.find((item) => item.name === itemInfo.name);
                 if (existingItem) {
                     existingItem.quantity += 1; 
                 } else {
                     inventory.items.push({ item_id: itemInfo.id, name: itemInfo.name,description:itemInfo.description, quantity: 1 , is_usable: itemInfo.is_usable, is_sellable: itemInfo.is_sellable,requirements:JSON.parse(itemInfo.requirements),actions:JSON.parse(itemInfo.actions),}); 
                 }

                 await db.query('UPDATE inventory SET object =? WHERE userId =?',[JSON.stringify(inventory),userId])
                }
            }
            return res.status(200).json({ message: "Vehicle deleted successfully" });
        } else {
            return res.status(404).json({ message: "No matching vehicle found" });
        }
    } catch (e) {
        console.error('Error deleting data: ', e);
        return res.status(500).json({ message: "Problem deleting data" });
    }
});
router.put('/setvehicleransfer',async (req,res) =>{
    if(!req.body){
        return res.status(400).json({message:"no data provided"})
    }
    const {userId, documentTransfer,plate} = req.body
    if(!userId||!documentTransfer || !plate){
       return res.status(400).json({message:"no idTransfer or plate provided"})
    }
    try{
        const [vehicleData] = await db.query('SELECT * FROM vehiculos WHERE placa =? AND owner =?',[plate,userId])
        if(vehicleData.length === 0){
            return res.status(404).json({message:"no vehicle founded"})
        }
        const vehicle = vehicleData[0]
        if(vehicle.status && vehicle.status === "incautado"){
            return res.status(401).json({message:"No se puede transferir el vehiculo si está incautado "})

        }
        const [userToTransferData] = await db.query('SELECT userId FROM cedulas WHERE documentId =?',[documentTransfer])
        if(userToTransferData.length === 0){
            return res.status(404).json({message:"no user to transfer data founded"})
        }
        const now =new Date()
        const idToTransfer = userToTransferData[0].userId
        const deleteDate = new Date(now.getTime() + 24 * 60 * 60000)
        const code = generateCode()
        await db.query(
            'UPDATE vehiculos SET owner = 0, idTransfer = ?, orgId = ?, transfer = 1, maxTransDate = ?, code = ? WHERE placa = ?',
            [idToTransfer, userId, deleteDate, code, plate]
        );
        sendCode(documentTransfer,idToTransfer,code,userId,vehicle)
       return res.status(200).json({message:"transfer req successfully started"})
    }catch(e){
      console.log(e)
      return res.status(500).json({message:"internal server error"})
    }
   


})
router.put('/acepttransfer',async (req,res) =>{
    if(!req.body){
        return res.status(400).json({message:"no data provided"})
    }
    const {userId, plate} = req.body
    if(!userId || !plate){
       return res.status(400).json({message:"no userId or plate provided"})
    }
    try{
        const [vehicleData] = await db.query('SELECT * FROM vehiculos WHERE placa =? AND transfer = 1',[plate])
        if(vehicleData.length === 0){
            return res.status(404).json({message:"no vehicle founded"})
        }
        const vehicle = vehicleData[0]
   
        await db.query(
            'UPDATE vehiculos SET owner = ?, idTransfer = null, orgId = null, transfer = null, maxTransDate = null, code = null WHERE placa = ?',
            [userId,plate]
        );
       return res.status(200).json({message:"transfer completed successfully"})
    }catch(e){
      console.log(e)
      return res.status(500).json({message:"internal server error"})
    }
   


})
router.put('/denegatetransfer',async (req,res) =>{
    if(!req.body){
        return res.status(400).json({message:"no data provided"})
    }
    const {userId, plate} = req.body
    if(!userId || !plate){
       return res.status(400).json({message:"no userId or plate provided"})
    }
    try{
        const [vehicleData] = await db.query('SELECT * FROM vehiculos WHERE placa =? AND transfer = 1',[plate])
        if(vehicleData.length === 0){
            return res.status(404).json({message:"no vehicle founded"})
        }
        const vehicle = vehicleData[0]
   
        await db.query(
            'UPDATE vehiculos SET owner = ?, idTransfer = null, orgId = null, transfer = null, maxTransDate = null, code = null WHERE placa = ?',
            [userId,plate]
        );
       return res.status(200).json({message:"transfer canceled successfully"})
    }catch(e){
      console.log(e)
      return res.status(500).json({message:"internal server error"})
    }
   


})
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendCode(documentId, userId, code, senderId, vehicledata) {
    try {
        

      
        const embed = new EmbedBuilder()
            .setTitle('📲 Solicitud de transferencia vehicular')
            .setDescription(`el usuario <@${senderId}> te quiere transferir un registro vehicular, para aceptarlo entra a https://cacolombia.com/v1/runt/vehicletransfer?code=${code}&documentId=${documentId}`)
            .addFields(
                {name:"Modelo del vehiculo",value:vehicledata.nombre},
                {name:"Placa",value:vehicledata.placa},
                {name:"Color",value:vehicledata.color},
                {name:"Blindado",value:vehicledata.blindado?"Vehiculo blindado":"no aplica"},
            )
            .setColor(0xff0000)
            .setFooter({ text: "No compartas este link con nadie, tienes 24 horas para aceptar el registro" });

      
        const user = await discordClient.users.fetch(userId);
        if (!user) throw new Error("User not found");

        await user.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Error sending code to ${userId}:`, error);
        throw error;
    }
}


module.exports=router


