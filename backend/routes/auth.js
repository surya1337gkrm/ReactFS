const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middlewares/is-auth');

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please Enter a Valid Email.')
      .custom((val, { req }) => {
        return User.findOne({ email: val }).then((user) => {
          if (user) {
            return Promise.reject('Email already exists');
          }
        });
      })
      .normalizeEmail(),
    body('password').trim().isLength({ min: 5 }),
    body('name').trim().not().isEmpty(),
  ],
  authController.signUp
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getStatus);

router.patch(
  '/status',
  isAuth,
  [body('status').trim().not().isEmpty()],
  authController.updateStatus
);

module.exports = router;
