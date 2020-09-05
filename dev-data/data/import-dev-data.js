/*eslint-disable*/
const fs = require("fs");
const Tour = require("../../Models/tourModel");

const dotenv = require("dotenv");

dotenv.config({ path: "../../config.env" });



const mongoose = require("mongoose");
const db = `mongodb+srv://karel:7plpMDBUon9YiQew@cluster0-etbsn.mongodb.net/natours?retryWrites=true&w=majority`;
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

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));

const updateItem = async () => {
  await Tour.create(tours);
  console.log("Update Item");
  process.exit();
};

const deleteItem = async () => {
  await Tour.deleteMany();
  console.log("Delete Items");
  process.exit();
};

if (process.argv.includes("--update")) {
  updateItem();
} else if (process.argv.includes("--delete")) {
  deleteItem();
}
