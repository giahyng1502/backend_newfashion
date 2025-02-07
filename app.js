var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var indexRouter = require("./routes/product");
var saleProduct = require("./routes/saleProduct");
var usersRouter = require("./routes/users");
var cartRouter = require("./routes/cart");
var voucherRouter = require("./routes/voucher");
var orderRouter = require("./routes/order");
var postRouter = require("./routes/post");
var categoryRouter = require("./routes/category");
var emailRouter = require("./routes/mailRouter");
var authRouter = require("./routes/authRouter");
var momoRouter = require("./routes/momoRouter");
var cloudRouter = require("./routes/cloudeRouter");

var app = express();
var db = require("./models/db");
db;
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/cart", cartRouter);
app.use("/voucher", voucherRouter);
app.use("/order", orderRouter);
app.use("/post", postRouter);
app.use("/saleProduct", saleProduct);
app.use("/category", categoryRouter);
app.use("/mail", emailRouter);
app.use("/auth", authRouter);
app.use("/momo", momoRouter);
app.use("/upload", cloudRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
