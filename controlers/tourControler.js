const Tour = require("../Models/tourModel");
const ApiFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const ErrorHandling = require("../utils/errorHandling");
const { deleteOne } = require("./handlerFactory");

exports.aliasCheapTours = (req, res, next) => {
  req.query.sort = "price,-ratingsAverage";
  req.query.limit = "5";
  req.query.fields = "name,price,summary,difficulty,ratingsAverage";
  next();
};

exports.getAllTours = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Tour, req.query)
    .filter()
    .sortBy()
    .limitFields()
    .paginate();
  const data = features.query;
  const tours = await data;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

// 2. to get spesific tour
exports.getSpesificTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate("reviews");

  if (!tour) return next(new ErrorHandling("Tour Doesn't Exist", 404));

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// 3. to post tour
exports.postTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

// 4. to patch tour
exports.patchTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true, // Make sure the req.body have same schema
  });

  if (!tour) return next(new ErrorHandling("Tour Doesn't Exist", 404));

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

// 5. to delete tour
exports.deleteTour = deleteOne(Tour);
// =========================================================================
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) return next(new ErrorHandling("Tour Doesn't Exist", 404));

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

// Aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // Stages
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: "ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: -1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    // Stages
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStats: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { month: -1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: plan,
  });
});
