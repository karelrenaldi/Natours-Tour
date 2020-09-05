const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const wait = require("waait");
const User = require("../Models/userModel");
const catchAsync = require("../utils/catchAsync");
const ErrorHandling = require("../utils/errorHandling");
const sendEmail = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });

const createSendToken = (res, user, statusCode) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createSendToken(res, newUser, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password provided
  if (!email || !password)
    return next(new ErrorHandling("Please provide email or password", 400));

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.checkPassword(password, user.password)))
    return next(new ErrorHandling("Incorrect email or password", 401));

  // 3) If everything ok, send token to client
  createSendToken(res, user, 200);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  const { authorization: auth } = req.headers;
  // Getting token
  if (auth && auth.startsWith("Bearer")) {
    token = auth.split(" ")[1];
  }

  if (!token)
    return next(
      new ErrorHandling(
        "You are not logged in! Please log in to get access.",
        401
      )
    );
  // Verification token
  const verifyFn = promisify(jwt.verify);
  const decoded = await verifyFn(token, process.env.JWT_SECRET_KEY);
  const { id, iat: jwtTimestamp } = decoded;

  // Check if user still exists
  const user = await User.findById(id);
  if (!user) {
    return next(
      new ErrorHandling(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // Check if user changed password after the token issued
  if (user.changePasswordAfter(jwtTimestamp)) {
    return next(
      new ErrorHandling(
        "User recently changed password! Please login again",
        401
      )
    );
  }

  req.user = user;

  next();
});

exports.restrictTo = (...role) => (req, res, next) => {
  if (!role.includes(req.user.role)) {
    return next(
      new ErrorHandling("You don't have permission to perform this action", 403)
    );
  }

  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on email post
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new ErrorHandling("There is no user with that email address", 404)
    );

  // 2. Generate random reset token
  const token = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${token}`;
  const message = `Please follow this URL link to reset your password : ${resetURL}`;

  try {
    await sendEmail({
      email: req.body.email,
      subject: `Your link reset email (Valid only 10 min)`,
      text: message,
    });

    res.status(200).json({
      status: "Success",
      message: "Reset token link has been sent",
    });
  } catch (err) {
    user.resetToken = undefined;
    user.resetTokenExpired = undefined;

    await user.save({ validateBeforeSave: false });

    next(
      new ErrorHandling(
        "There was an error sending the email, Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetToken: hashToken,
    resetTokenExpired: { $gt: Date.now() },
  });

  // 2) If token hasn't expired, and there is user, set the new password
  if (!user) {
    return next(new ErrorHandling("The token is invalid or has expired", 400));
  }

  // 3) Update change passwordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetToken = undefined;
  user.resetTokenExpired = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Pending jwt token
  await wait(process.env.PENDING);

  // 5) Log the user in, send JWT
  createSendToken(res, user, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  // 1) Get user from collection
  const user = await User.findById(req.user._id).select("+password");

  // 2) Check if posted current password is correct
  if (!(await user.checkPassword(currentPassword, user.password))) {
    return next(new ErrorHandling("Your current password is wrong", 401));
  }

  // 3) If correct, update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Pending
  await wait(process.env.PENDING);

  // 5) Log user in, send JWT
  createSendToken(res, user, 200);
});
