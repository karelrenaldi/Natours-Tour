const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception!!");
  console.log(`${err.name} : ${err.message}`);
  console.log("Shutdown");
  process.exit(1);
});

const db = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
(async () => {
  await mongoose.connect(db, {
    // options for deal some deprecations warning when creating our app
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  console.log("Database connection successful");
})();

const app = require("./app");

const port = 8000 || process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running at port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection!!");
  console.log("===================");
  console.log(`${err.name} : ${err.message}`);
  console.log("===================");
  console.log("Shutdown");
  console.log("===================");
  server.close(() => {
    process.exit(1);
  });
});
