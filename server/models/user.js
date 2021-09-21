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
      clicks: {
        type: Number
      }
    }
  }
});

const User = mongoose.model("User", userSchema);

export default User;