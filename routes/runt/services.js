const express= require('express')
const router = express.Router()
const db = require('../../db/db');

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
    console.log(restrictions)
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

module.exports=router