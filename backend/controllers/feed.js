const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');
const io = require('../socket');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const postsPerPage = 2;
  let totalPosts;
  //descending order-> sort({<by which propety>:-1})
  Post.find()
    .countDocuments()
    .then((count) => {
      totalPosts = count;
      return Post.find()
        .populate('creator')
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * postsPerPage)
        .limit(postsPerPage);

      //populate will take 2 params.
      //first parameter will be the new property that will be added to each element found
      //second parameter will be the value of the property that will be fetched from the linked Model [ here name will be
      // fetched from the User model because it is referenced in the model definition]
    })
    .then((posts) => {
      return res.status(200).json({
        message: 'Fetched Posts.',
        posts: posts,
        totalItems: totalPosts,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = async (req, res, next) => {
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
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl: imageUrl,
    creator: req.userId,
    //when authenticated, we added userId property to the req object
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();

    //emit will send message to all users
    //broadcast will send message to all users except to self
    //while emitting, we need to add an event name and a js object with information which we want to pass
    io.getIO().emit('posts', {
      action: 'create',
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });

    return res.status(201).json({
      message: 'successfully created',
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    //simillarly inside a async code, throwing errors will not reach the
    //error handling middleware. so we need to call next with the error
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate('creator', 'name')
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

exports.updatePost = async (req, res, next) => {
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

  try {
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post Not Found.');
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not Authorized.');
      error.statusCode = 403;
      throw error;
    }

    //delete the previous file if it's changed
    if (imageUrl !== post.imageUrl) {
      deleteFile(post.imageUrl);
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = await post.save();

    io.getIO().emit('posts', {
      action: 'update',
      post: result,
    });
    return res.status(200).json({
      message: 'Post Updated',
      post: result,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error('Post Not Found.');
        error.statusCode = 404;
        throw error;
      }
      //check if the loggedin user is same as the creator of the post
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not Authorized.');
        error.statusCode = 403;
        throw error;
      }
      //delete file
      deleteFile(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      //after deleting the post, delete the post reference from the user
      return User.findById(req.userId);
    })
    .then((user) => {
      //mongoose provides pull method which we can use to delete the element based on the id.
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      io.getIO().emit('posts', {
        action: 'delete',
        post: result,
      });
      return res.status(200).json({ message: 'Deleted successfully.' });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};

//helper function to delete the file
const deleteFile = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
