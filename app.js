/*eslint-disable*/
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// Routes
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

// Error Controller
const errorControler = require("./controlers/errorControler");

// Error Middleware
const ErrorHandling = require("./utils/errorHandling");

const app = express();

/* ======= Global Middleware =======*/
// 1. Helmet (Set security http headers)
app.use(helmet());

// 2. Development Logging
process.env.NODE_ENV === "development" ? app.use(morgan("dev")) : null;

// 3. Limit request from same IP
const limiter = rateLimit({
  max:100,
  windowMs: 15 * 60 * 1000,
});
app.use("/api", limiter);

// 4. Body parser, reading data from body to req.body
app.use(express.json());

// 5. Data sanitization against noSql query injection
app.use(mongoSanitize());

// 6. Data sanitization against XSS
app.use(xss());

// 7. Prevent parameter pollution
app.use(hpp({
  whitelist: [
    "duration",
    "ratingsQuantity",
    "ratingsAverage",
    "maxGroupSize",
    "difficulty",
    "price",
  ],
}));

// 8. Serving static files
app.use(express.static(`${__dirname}/public`));

// 9. Test middleware
app.use((req, res, next) => {
  next();
})

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
// <======= Route Handling =======>
app.all("*", (req, res, next) => next(new ErrorHandling(`Your Route ${req.originalUrl} Not Found`, 404)));

// <======= Error Global Middleware =======>
app.use(errorControler);

// <======= Routing =======>
// <======= Server =======>
module.exports = app;
