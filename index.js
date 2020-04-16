//"use strict";
const express = require('express');
const app = express();
const config = require('./config/config')
const Port = config.Port || process.env.Port || 3000;
var bodyParser = require('body-parser')
const path = require('path');
const listEndpoints = require('express-list-endpoints')


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname+'./uploads')))

const routes = require('./routes')

app.use('/api/v1/user', routes.user)



//Databse connection
var con = require('./connection/connection')
con();

app.listen(Port,()=>{
  console.log(`App is listening to Port: ${Port}`)
  console.log(listEndpoints(app));
})