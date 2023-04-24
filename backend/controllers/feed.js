const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({ message: 'Fetched Posts.', posts: posts });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //inside a synchronous fn, when we have an error,
    // throwing the error will stop the fn exectuion and reaches to the error handling middleware
    const error = new Error('Validation Failed.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No Image Found.');
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path.replace('\\', '/');
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title,
    content,
    imageUrl: imageUrl,
    creator: { name: 'surya' },
  });
  post
    .save()
    .then((result) => {
      return res.status(201).json({
        message: 'successfully created',
        post: result,
      });
    })
    .catch((err) => {
      //simillarly inside a async code, throwing errors will not reach the
      //error handling middleware. so we need to call next with the error
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      //if post is empty
      if (!post) {
        const error = new Error('No post found.');
        error.statusCode = 404;
        //throwing an error in then block (async code) will reach reach to the catch block
        throw error;
      }

      return res.status(200).json({ message: 'Post Fetched.', post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed.');
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  //for the imageUrl, if it's not updated, it will be a string
  let imageUrl = req.body.image;

  //if image is updated, then we will get the image as part of req.file
  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }
  if (!imageUrl) {
    const error = new Error('No File is Picked.');
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Post Not Found.');
        error.statusCode = 404;
        throw error;
      }

      //delete the previous file if it's changed
      if (imageUrl !== post.imageUrl) {
        deleteFile(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((result) => {
      return res.status(200).json({
        message: 'Post Updated',
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//helper function to delete the file
const deleteFile = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
