const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    // required: true,
    //setting a default value
    default: "Hey there! I'm Online",
  },
  //posts is an array of type defined
  posts: [
    {
      type: Schema.Types.ObjectId,
      //referencing the model Post
      ref: 'Post',
    },
  ],
});

module.exports = mongoose.model('User', userSchema);
