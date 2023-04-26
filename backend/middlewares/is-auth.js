const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  //either use req.headers['authorization']
  //or
  const header = req.get('Authorization');
  if (!header) {
    const error = new Error('Not Authenticated');
    error.statusCode = 401;
    throw error;
  }
  const token = req.get('Authorization').split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      next(err);
    }
  }
  //decoded and verification failed then return AuthenticationError
  if (!decodedToken) {
    const error = new Error('Not Authenticated');
    error.statusCode = 401;
    throw error;
  }
  //if verified, access data from token and store the data in the req object
  req.userId = decodedToken.id;
  next();
};
