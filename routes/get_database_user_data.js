/**
 * @swagger
 * /v1/getUserData:
 *   get:
 *     summary: Retrieve user data from multiple sources
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch data for
 *       - name: driverLicence
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Include driver's license data
 *       - name: vehicles
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Include vehicle data
 *       - name: arrestRecord
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Include arrest record data
 *       - name: tickets
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Include tickets data
 *       - name: warnings
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Include warnings data
 *       - name: byc
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Include search and capture records
 *     responses:
 *       200:
 *         description: Successfully retrieved user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: User not found or userId not provided
 *       500:
 *         description: Internal server error
 */

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
      const  byc= req.query.byc === 'true'
      const  driveTest= req.query.driveTest === 'true'
      const  license_request= req.query.license_request === 'true'
      
    //verify data
    if(!userId){
      return res.status(404).json('the userId is not provided')
    }
    const responseData = {};
    const [userCheck] = await db.query('SELECT * FROM users WHERE user_id=?',[userId])
    if(userCheck.length ===0){
        return res.status(404).json('no user info founded')
    }else{
        responseData.documentData = userCheck;
    }


  
    try{
        if(driverLicence){
            const [driverLicenceResult] = await db.query('SELECT * FROM licenses WHERE user_id=? ',[userId])
            if (driverLicenceResult.length > 0) {
                responseData.driverLicence = driverLicenceResult;
            }
        }
        if(vehicles){
            const [vehiclesResult] = await db.query('SELECT * FROM vehicles WHERE user_id=? ',[userId])
    
            if (vehiclesResult.length > 0) {
                responseData.vehicles = vehiclesResult;
            }
        }
        if(arrestRecord){
            const [arrestRecordResult] = await db.query('SELECT * FROM arrests WHERE user_id=? ',[userId])
            if (arrestRecordResult.length > 0) {
                responseData.arrestRecord = arrestRecordResult;
            }
        }
        if(tickets){
            const [ticketsResult] = await db.query('SELECT * FROM infractions WHERE user_id =? ',[userId])
            if (ticketsResult.length > 0) {
                responseData.tickets = ticketsResult;
            } 
        }
        if(driveTest){
            const [driveTestResult] = await db.query('SELECT * FROM drive_test WHERE user_id =? ',[userId])
            if (driveTestResult.length > 0) {
                responseData.driveTest = driveTestResult;
            } 
        }
        if(license_request){
            const [requestResult] = await db.query('SELECT * FROM license_requests WHERE user_id =? ',[userId])
            if (requestResult.length > 0) {
                responseData.license_request = requestResult;
            } 
        }
    
        if(warnings){
            const [warningsResult] = await db.query('SELECT * FROM observaciones WHERE user_id=? ',[userId])
            if (warningsResult.length > 0) {
                responseData.warnings = warningsResult;
            }
        }
        if(byc){
            const [bycresult] = await db.query('SELECT * FROM wanted WHERE user_id=? ',[userId])
            if (bycresult.length > 0) {
                responseData.byc = bycresult;
            }
        }

        res.status(200).json(responseData);
    }catch(e){
        console.log(e)
        res.status(500).json('error trying to get the info')
    }
   

    //res

    

    
    


   
});

module.exports =router