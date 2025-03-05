const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ca Colombia api docs',
      version: '1.0.0',
      description: ' v1 docs for api REST Ca colombia ',
    },
    servers: [
      {
        url:'https://cacolombia.com/',
        description:'Ca colombia url'
      },
      {
        url:'http://localhost:8080/',
        description:'localhost'
      },
     
    ],
  },
  apis: [path.join(__dirname, '../routes/*.js'),path.join(__dirname, '../routes/denuncias/*.js')], 

  
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

const swaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = swaggerDocs;
