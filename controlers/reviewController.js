const Review = require("../Models/reviewModel");
const catchAsync = require("../utils/catchAsync");
const { deleteOne } = require("./handlerFactory");

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const filter = req.params.id ? { tour: req.params.id } : {};
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.id;
  if (!req.body.user) req.body.user = req.user._id;

  const review = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      review,
    },
  });
});

exports.deleteReview = deleteOne(Review);
