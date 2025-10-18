import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { residencyRoute } from "./routes/residencyRoute.js";
import { buyerRoute } from "./routes/buyerRoute.js";
import { offerRoute } from "./routes/offerRoute.js";
import { dealRoute } from "./routes/dealRoute.js";
import { buyerActivityRoute } from "./routes/buyerActivityRoute.js";
import { qualificationRoute } from "./routes/qualificationRoute.js";
import { emailListRoute } from "./routes/emailListRoute.js";
import { jwtCheck, extractUserFromToken } from "./middlewares/authMiddleware.js";
import { userManagementRoute } from "./routes/userManagementRoute.js";
import { trackActivity } from "./middlewares/auditMiddleware.js";
import { propertyRowRoute } from "./routes/propertyRowRoute.js";
import { settingsRoute } from "./routes/settingsRoute.js";
import { visitorRoute } from "./routes/visitorRoute.js";
import { initScheduledTasks } from "./services/scheduledTasks.js";
import { mailivoAutomationRoute } from "./routes/mailivoAutomationRoute.js";
import { automationClosingDateRoute } from "./routes/automationClosingDateRoute.js";
import { pdfMergeRoute } from "./routes/pdfMergeRoute.js";

const app = express();
const PORT = process.env.PORT || 8200;

// Create __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- CORS (single, strict layer) ----
const allowedOrigins = [
  "https://landivo.com",
  "https://api.landivo.com",
  "https://mailivo.landivo.com",
];

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser / same-origin requests (no Origin header)
      if (!origin) return cb(null, true);
      return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control", // important for progress polling robustness
      "Pragma",
    ],
    optionsSuccessStatus: 200, // some legacy browsers choke on 204
    maxAge: 600, // cache preflight for 10 minutes
  })
);

// Reflect Origin + set Vary (nice for proxies/caches)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  next();
});

// Core middleware
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// API routes
app.use("/residency", residencyRoute);
app.use("/user", userManagementRoute);
app.use("/property-rows", propertyRowRoute);
app.use("/buyer", buyerRoute);
app.use("/offer", offerRoute);
app.use("/buyer", buyerActivityRoute);
app.use("/qualification", qualificationRoute);
app.use("/email-lists", emailListRoute);
app.use("/deal", dealRoute);
app.use("/property-rows", propertyRowRoute);
app.use("/settings", settingsRoute);
app.use("/visitors", visitorRoute);
app.use("/mailivo/automation", mailivoAutomationRoute);
app.use("/automation/closingDates", automationClosingDateRoute);
app.use("/api/pdf-merge", pdfMergeRoute);
app.use(trackActivity);

// Serve static "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Auth test route
app.get("/auth/test-jwt", jwtCheck, extractUserFromToken, (req, res) => {
  console.log("Authenticated user:", req.user);
  res.json({
    message: "Authentication successful",
    user: req.user,
  });
});

// Initialize scheduled tasks
initScheduledTasks();

// Start the server
app.listen(PORT, () => {
  console.log("Uploads folder path:", path.join(__dirname, "uploads"));
  console.log(`Backend is running on port ${PORT}`);
});
