const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();

dotenv.config({ path: "./config/config.env" });
connectDB();

// ================= RATE LIMITERS =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true,
});

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [],
    credentials: true,
  })
);

// Global limiter
app.use(limiter);

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// ================= ROUTES =================
const customerRoutes = require("./routes/customer_route");

// Apply authLimiter to BOTH login routes
app.use("/api/v1/customers/login", authLimiter);
app.use("/blogify/customers/login", authLimiter); // optional (keep old)

// Mount the same router on BOTH base paths
app.use("/api/v1/customers", customerRoutes);
app.use("/blogify/customers", customerRoutes); // optional (keep old);

// ================= ERROR HANDLER =================
app.use(errorHandler);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Blogify server running on port ${PORT}`.green.bold.underline
  );
});