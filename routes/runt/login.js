const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const db = require('../../db/db')
const axios = require('axios')
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const SECRET_KEY = process.env.SECRET_KEY
const BOT_TOKEN = process.env.BOT_TOKEN
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
discordClient.login(BOT_TOKEN);
router.post('/login-code',async(req,res)=>{
    if(!req.body){
        return res.status(400).json({message:"no data provided"})
    }
    if(!req.body.documentId ||typeof req.body.documentId != "string"){
        return res.status(400).json({message:"no documentId provided or documentId is not a string"})
    }
    try {
    const documentId = req.body.documentId
   const [data] = await db.query('SELECT user_id,roblox_id,discord_id FROM users WHERE roblox_id =?',[documentId])
   if(data.length === 0){
      return res.status(404).json({message:"no se encontró al usuario"})
   }
   console.log(data)
   const userId = data[0].user_id;
   const code = generateCode()
   const now =new Date()
   const deleteDate = new Date(now.getTime() + 10 * 60000)
   await db.query('DELETE FROM temp_codes WHERE reqId =?',[userId])
   await db.query('INSERT INTO temp_codes (code,reqId,delete_date) VALUES(?,?,?)',[code,userId,deleteDate])
   await sendCode(data[0].discord_id, code, req.ip);
   return res.json({ message: "Code sent successfully", userId:userId});
} catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error sending code" });
}

})
router.post('/login', async (req,res)=>{
    if(!req.body){
        return res.status(400).json({message:"no data provided"})
    }
    const {userId,code} = req.body
    if(!userId || !code){
        return res.status(400).json({message:"no documentId or code provided."})

    }
    if (typeof userId !== "string" || typeof code !== "number") {
        return res.status(400).json({ message: "Invalid userId or code provided." });
    }
   
    try{
        const [codever] = await db.query('SELECT * FROM temp_codes WHERE reqId =? AND code =?',[userId,code])
        if(codever.length === 0){
            return res.status(401).json({message:"no valid code"})
        }
        const now = new Date()
        if(codever[0].delete_date < now){
            await db.query('DELETE FROM temp_codes WHERE code_id =?',[codever[0].code_id])
            return res.status(401).json({message:"no valid code"})
        }
        const [data] = await db.query('SELECT * FROM users WHERE user_id =?',[userId])
        if(data.length === 0){
            return res.status(401).json({message:"No cuenta con cedula"})
        }
        const userdata = data[0]
        const session_data = {
            userdata:userdata
        }
        const token = jwt.sign(session_data,SECRET_KEY,{expiresIn:'1h'})
        res.cookie('runt_token',token,{
            httpOnly:true,
            maxAge:3600000
        })
       return  res.status(201).json({message:"login successfully"})
      

        
    }catch(e){
        console.log(e)
        return res.status(500).json({message:"internal server error"})
    }
})
router.post('/logout', (req, res) => {
    res.clearCookie('runt_token', { path: '/' }); 
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
});
module.exports = router

//function
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendCode(userId, code) {
    try {
        

      
        const embed = new EmbedBuilder()
            .setTitle('🔐 CÓDIGO DE SEGURIDAD')
            .setDescription(`Se está intentando acceder a tu nombre en la pagina de https://app.cacolombia.com/v1/runt/login. si no eres tu Haz caso omiso a este mensaje`)
            .addFields(
                { name: "🔑 Código", value: `||${code}||`, inline: false }
            )
            .setColor(0xff0000)
            .setFooter({ text: "No compartas este código con nadie." });

      
        const user = await discordClient.users.fetch(userId);
        if (!user) throw new Error("User not found");

        await user.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Error sending code to ${userId}:`, error);
        throw error;
    }
}

