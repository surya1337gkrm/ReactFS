const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
require('dotenv').config();

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

//create a writable stream to which logs will be written
//add 'a' flag to append the logs to the file instead of rewriting.
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'accesss.log'),
  {
    flags: 'a',
  }
);

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

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));
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
  .then((result) => {
    const server = app.listen(8080);
    //web sockets work on top of http protocol
    //so, we need to create the server and should pass server as an argument to socket function

    const io = require('./socket').init(server);
    //we can listen to events on io server
    // when a connection is established, callback fn will be called with the incoming scoket client.
    io.on('connection', (socket) => {
      console.log('Connected');
    });
  })
  .catch((err) => console.log(err));
