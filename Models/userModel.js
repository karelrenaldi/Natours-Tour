const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: [true, "Email has been taken"],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on Create / Save !!!
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords aren't same",
    },
  },
  passwordChangedAt: Date,
  resetToken: String,
  resetTokenExpired: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // Delete password confirm
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.checkPassword = async (inputPassword, actualPassword) => {
  return await bcrypt.compare(inputPassword, actualPassword);
};

userSchema.methods.changePasswordAfter = function (timestamp) {
  const { passwordChangedAt } = this;
  if (passwordChangedAt) {
    return parseInt(passwordChangedAt.getTime() / 1000, 10) > timestamp;
  }
  return false;
};

userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  // 1. Hash token before store to db
  this.resetToken = crypto.createHash("sha256").update(token).digest("hex");
  // 2. Add expired token
  this.resetTokenExpired = Date.now() + 10 * 60 * 1000; // 10 minutes

  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
