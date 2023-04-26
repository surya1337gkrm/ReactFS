const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Error');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });
      return user.save();
    })
    .then((result) => {
      return res
        .status(201)
        .json({ message: 'User Created.', userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error('User Not Found');
        //401 for not authenticated
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Invalid Credentials.');
        error.statusCode = 401;
        throw error;
      }
      //Valid Credentials -> generate JWT
      const token = jwt.sign(
        {
          email: loadedUser.email,
          id: loadedUser._id.toString(),
        },
        process.env.SECRET_KEY,
        {
          //h for hours, m for minutes, s for seconds
          expiresIn: '1h',
        }
      );
      return res.status(200).json({
        message: 'Loggedin successfully.',
        token,
        userId: loadedUser._id.toString(),
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      return res
        .status(200)
        .json({ message: 'User Found', status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateStatus = (req, res, next) => {
  const { status } = req.body;
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      user.status = status;
      return user.save();
    })
    .then((result) => {
      return res.status(200).json({ message: 'Status Updated.' });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
