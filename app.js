var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
// var cors = require("cors");
var indexRouter = require("./routes/product");
var saleProduct = require("./routes/saleProduct");
var usersRouter = require("./routes/users");
var information = require("./routes/informationRouter");
var cartRouter = require("./routes/cart");
var voucherRouter = require("./routes/voucher");
var orderRouter = require("./routes/order");
var postRouter = require("./routes/post");
var commentRouter = require("./routes/commentRouter");
var replyRouter = require("./routes/replyRouter");
var categoryRouter = require("./routes/category");
var subCategoryRouter = require("./routes/subCategoryRouter");
var emailRouter = require("./routes/mailRouter");
var authRouter = require("./routes/authRouter");
var momoRouter = require("./routes/momoRouter");
var cloudRouter = require("./routes/cloudRouter");
var messageRouter = require("./routes/messageRouter");
var dashBoardRouter = require("./routes/dashboard");
var bannerRouter = require("./routes/bannerRouter");
var notificationRouter = require("./routes/notificationRouter");
var tensorRouter = require("./routes/tensorRouter");

var { app } = require("./lib/socketConfig");
var db = require("./models/db");
db;
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/information",information );
app.use("/cart", cartRouter);
app.use("/voucher", voucherRouter);
app.use("/order", orderRouter);
app.use("/post", postRouter);
app.use("/saleProduct", saleProduct);
app.use("/category", categoryRouter);
app.use("/subcategory", subCategoryRouter);
app.use("/mail", emailRouter);
app.use("/auth", authRouter);
app.use("/momo", momoRouter);
app.use("/comment", commentRouter);
app.use("/replies", replyRouter);
app.use("/upload", cloudRouter);
app.use("/message", messageRouter);
app.use("/dashboard", dashBoardRouter);
app.use("/notification",notificationRouter );
app.use("/tensor",tensorRouter );
app.use("/banner",bannerRouter );

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
