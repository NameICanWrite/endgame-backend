import mongoose from "mongoose";
import validator from "validator";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "This email already exists"],
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 5,
  },
  active: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    required: [true, "data is required"],
    default: {
      clicks: Number,
      loses: Number
    }
  }
});
userSchema.post('save', function(error, doc, next) {
  if ((error.name === 'MongoError' || error.name === 'MongoServerError') && error.code === 11000) {
    next(new Error('Email must be unique'));
  } else {
    next(error);
  }
  
}); 

const User = mongoose.model("User", userSchema);

export default User;