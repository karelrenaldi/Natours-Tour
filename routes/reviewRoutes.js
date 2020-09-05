const express = require("express");

const reviewRouter = express.Router({ mergeParams: true });

const {
  createReview,
  getAllReviews,
  deleteReview,
} = require("../controlers/reviewController");
const { protect, restrictTo } = require("../controlers/authController");

reviewRouter
  .route("/")
  .get(getAllReviews)
  .post(protect, restrictTo("user"), createReview);

reviewRouter.route("/:id").delete(deleteReview);

module.exports = reviewRouter;
