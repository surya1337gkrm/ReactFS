const { validationResult } = require('express-validator');
exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'First Post',
        content: 'First Post Content',
        imageUrl: 'images/sample.jpg',
        creator: {
          name: 'surya',
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: 'Validation Failed.', errors: errors.array() });
  }
  const title = req.body.title;
  const content = req.body.content;

  res.status(201).json({
    message: 'successfully created',
    post: {
      _id: new Date().toISOString(),
      title: title,
      content: content,
      creator: {
        name: 'Surya',
      },
      createdAt: new Date(),
    },
  });
};
