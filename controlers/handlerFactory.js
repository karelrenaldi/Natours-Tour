const catchAsync = require("../utils/catchAsync");
const ErrorHandling = require("../utils/errorHandling");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new ErrorHandling(`Document doesn't exist`, 404));

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
