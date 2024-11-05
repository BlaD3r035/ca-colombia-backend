const express = require('express');
const router = express.Router();
const db = require('../db/db');
//routes

//get all user db data


router.get('/showRecords', async (req,res)=>{
    const documentId = req.query.documentId
    //get userId with documentId
    if(documentId){
       const [dr]= await db.query('SELECT * FROM cedulas WHERE documentId=?',[documentId])
       if(dr.length=== 0){
        return  res.render('search_public_records',{message:'no se encontró este documento'})
       }
       const [ir]= await db.query('SELECT * FROM antecedentes WHERE userId=?',[dr[0].userId])
       if(ir.length=== 0){
        return res.render('show_public_records',{records:ir,document:dr[0]})
       }
      res.render('show_public_records',{records:ir,document:dr[0]})
       
    }else{
        res.render('search_public_records',)
    }
})


module.exports =router