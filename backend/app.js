const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//to read data json data we need to add bodyparser.json
app.use(bodyParser.json());
//fetches single file that stored on fieldname provided.
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
//serving static files
app.use('/images', express.static(path.join(__dirname, 'images')));

//set CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,Authorization');
  next();
});

//include the routes
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

//error handling middleware
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const errMsg = err.message;
  const data = err.data;
  res.status(status).json({ message: errMsg, data });
});
mongoose
  .connect(
    'mongodb+srv://surya1337:Maddy%401337@cluster0.rzlttud.mongodb.net/messages?retryWrites=true&w=majority'
  )
  .then((result) => app.listen(8080))
  .catch((err) => console.log(err));
