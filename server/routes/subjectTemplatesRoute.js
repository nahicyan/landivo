// server/routes/subjectTemplatesRoute.js
// NEW FILE - Proxy route to fetch templates from Mailivo
import express from "express";
import axios from "axios";

const router = express.Router();

const MAILIVO_API_BASE_URL = process.env.MAILIVO_API_BASE_URL || "https://api.mailivo.landivo.com";
const LANDIVO_API_KEY = process.env.LANDIVO_API_KEY;

// GET /api/subject-templates - Fetch templates from Mailivo
router.get("/", async (req, res) => {
  try {
    if (!LANDIVO_API_KEY) {
      console.error("LANDIVO_API_KEY not configured");
      return res.status(500).json({
        success: false,
        error: "Service configuration error"
      });
    }

    const response = await axios.get(
      `${MAILIVO_API_BASE_URL}/subject-templates/public`,
      {
        headers: {
          'X-API-Key': LANDIVO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching subject templates from Mailivo:", error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error || "Failed to fetch templates"
      });
    }

    res.status(502).json({
      success: false,
      error: "Failed to connect to template service"
    });
  }
});

export { router as subjectTemplatesRoute };