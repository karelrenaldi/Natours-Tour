const express = require("express");

const userRouter = express.Router();
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require("../controlers/userControler");

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
} = require("../controlers/authController");

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.post("/forgotPassword", forgotPassword);
userRouter.patch("/resetPassword/:token", resetPassword);
userRouter.patch("/updateMyPassword", protect, updatePassword);
userRouter.patch("/updateMe", protect, updateMe);
userRouter.delete("/deleteMe", protect, deleteMe);

userRouter.route("/").get(getAllUsers).post(createUser);
userRouter.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = userRouter;
