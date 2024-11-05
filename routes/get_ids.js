const express = require('express');
const router = express.Router();
const db = require('../db/db');
//routes

//get user id with docId
router.get('/user', async(req,res) =>{
   const documentId = req.query.documentId;
   if(documentId){
    const [userId] =  await db.query('SELECT * FROM cedulas WHERE documentId =?',[documentId])
    if(userId.length === 0){
      return  res.status(404).json('no user founded')
    }
    return res.json(userId[0])
    


}else{
    return res.send('no user documentId provided ')

}

})
router.get('/plate', async(req,res) =>{
   const plate = req.query.plate;
   if(plate){
    const [userId] =  await db.query('SELECT owner FROM vehiculos WHERE placa =?',[plate])
    if(userId.length === 0){
      return  res.status(404).json('no plate founded')
    }
    return res.status(200).json(userId[0])
    


}else{
  console.log('no plate numb priv')
    return res.status(404).json('no plate number provided ')

}

})

module.exports =router