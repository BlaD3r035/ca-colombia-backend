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

module.exports=router