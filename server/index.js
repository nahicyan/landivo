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

// Email campaign functionality
import { emailCampaignRoute } from "./routes/emailCampaignRoute.js";
import { emailTemplateRoute } from "./routes/emailTemplateRoute.js";
import { emailTrackingRoute } from "./routes/emailTrackingRoute.js";
import { emailAutomationRoute } from "./routes/emailAutomationRoute.js";
import { initEmailScheduler } from "./services/emailScheduler.js";

const app = express();
const PORT = process.env.PORT || 8200;

// Create __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware setup
app.use(express.json({ limit: '5mb' })); 
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://landivo.com"], 
    credentials: true,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://landivo.com");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Serve static "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use(trackActivity);
app.use("/api/user", userManagementRoute);
app.use("/api/residency", residencyRoute);
app.use("/api/property-rows", propertyRowRoute);
app.use("/api/buyer", buyerRoute);
app.use("/api/offer", offerRoute);
app.use("/api/buyer", buyerActivityRoute);
app.use("/api/qualification", qualificationRoute);
app.use("/api/email-lists", emailListRoute);
app.use("/api/deal", dealRoute);
app.use("/api/property-rows", propertyRowRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/visitors", visitorRoute);

// Add email campaign routes
app.use("/api/email-campaigns", emailCampaignRoute);
app.use("/api/email-templates", emailTemplateRoute);
app.use("/api/email-tracking", emailTrackingRoute);
app.use("/api/email-automation", emailAutomationRoute);

// Auth test route
app.get("/auth/test-jwt", jwtCheck, extractUserFromToken, (req, res) => {
  console.log("Authenticated user:", req.user);
  res.json({ 
    message: "Authentication successful", 
    user: req.user 
  });
});

// Initialize scheduled tasks
initScheduledTasks();

// Initialize email scheduler
if (process.env.NODE_ENV !== 'test') {
  initEmailScheduler();
  console.log('Email scheduler initialized');
}

// Start the server
app.listen(PORT, () => {
  console.log("Uploads folder path:", path.join(__dirname, "uploads"));
  console.log(`Backend is running on port ${PORT}`);
});