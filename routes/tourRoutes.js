const express = require("express");

const tourRouter = express.Router();
const reviewRouter = require("./reviewRoutes");

const {
  getAllTours,
  postTour,
  getSpesificTour,
  patchTour,
  deleteTour,
  aliasCheapTours,
  getTourStats,
  getMonthlyPlan,
} = require("../controlers/tourControler");
const { protect, restrictTo } = require("../controlers/authController");

// Middleware
// tourRouter.param("id", checkId);

// Merge params
tourRouter.use("/:id/reviews", reviewRouter);

// Practice 1 ==> make 5 top cheap tours
tourRouter.route("/the-cheap-5").get(aliasCheapTours, getAllTours);

tourRouter.route("/").get(protect, getAllTours).post(postTour);

// Tour stats
tourRouter.route("/tour-stats").get(getTourStats);
tourRouter.route("/getMonthlyPlan/:year").get(getMonthlyPlan);

tourRouter
  .route("/:id")
  .get(protect, getSpesificTour)
  .patch(protect, patchTour)
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

module.exports = tourRouter;
