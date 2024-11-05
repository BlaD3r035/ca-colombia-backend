const express = require('express');
const router = express.Router();
const db = require('../db/db');
//routes

//get all user db data

router.get('/getUserData', async (req, res) => {

     //req const
      const  userId= req.query.userId
      const  driverLicence= req.query.driverLicence === 'true'
      const vehicles= req.query.vehicles === 'true'
      const  arrestRecord= req.query.arrestRecord === 'true'
      const tickets= req.query.tickets === 'true'
      const  warnings= req.query.warnings === 'true'
 
    //verify data
    if(!userId){
      return res.status(404).json('the userId is not provided')
    }
    const responseData = {};
    const [userCheck] = await db.query('SELECT * FROM cedulas WHERE userId=?',[userId])
    if(userCheck.length ===0){
        return res.status(404).json('no user info founded')
    }else{
        responseData.documentData = userCheck;
    }


  
    try{
        if(driverLicence){
            const [driverLicenceResult] = await db.query('SELECT * FROM licencia WHERE userId=? ',[userId])
            if (driverLicenceResult.length > 0) {
                responseData.driverLicence = driverLicenceResult;
            }
        }
        if(vehicles){
            const [vehiclesResult] = await db.query('SELECT * FROM vehiculos WHERE owner=? ',[userId])
    
            if (vehiclesResult.length > 0) {
                responseData.vehicles = vehiclesResult;
            }
        }
        if(arrestRecord){
            const [arrestRecordResult] = await db.query('SELECT * FROM antecedentes WHERE userId=? ',[userId])
            if (arrestRecordResult.length > 0) {
                responseData.arrestRecord = arrestRecordResult;
            }
        }
        if(tickets){
            const [ticketsResult] = await db.query('SELECT * FROM multas WHERE userId=? ',[userId])
            if (ticketsResult.length > 0) {
                responseData.tickets = ticketsResult;
            } 
        }
    
        if(warnings){
            const [warningsResult] = await db.query('SELECT * FROM observaciones WHERE userId=? ',[userId])
            if (warningsResult.length > 0) {
                responseData.warnings = warningsResult;
            }
        }

        res.status(200).json(responseData);
    }catch(e){
        res.status(500).json('error trying to get the info')
    }
   

    //res

    

    
    


   
});

module.exports =router