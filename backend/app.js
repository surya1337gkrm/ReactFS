const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');

const app = express();

//to read data json data we need to add bodyparser.json
app.use(bodyParser.json());

//set CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,Authorization');
  next();
});

//include the routes
app.use('/feed', feedRoutes);
mongoose
  .connect(
    'mongodb+srv://surya1337:<password>@cluster0.rzlttud.mongodb.net/messages?retryWrites=true&w=majority'
  )
  .then((result) => app.listen(8080))
  .catch((err) => console.log(err));
