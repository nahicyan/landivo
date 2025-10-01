// server/routes/mailivoAutomationRoute.js
import express from "express";
import axios from "axios";

const router = express.Router();

// Environment variables for configuration
const MAILIVO_API_BASE_URL = process.env.MAILIVO_API_BASE_URL || "https://api.mailivo.landivo.com";
const MAILIVO_FRONTEND_BASE_URL = process.env.MAILIVO_FRONTEND_BASE_URL || "https://mailivo.landivo.com";
const LANDIVO_ALLOWED_REDIRECT_HOSTS = process.env.LANDIVO_ALLOWED_REDIRECT_HOSTS 
  ? process.env.LANDIVO_ALLOWED_REDIRECT_HOSTS.split(',')
  : ['mailivo.landivo.com'];

// Validation helper
const validateAutomationPayload = (body) => {
  const errors = [];
  
  if (!body.propertyID) errors.push("propertyID is required");
  if (!body.subject) errors.push("subject is required");
  if (!body.area && !body.listID) errors.push("area or listID is required");
  if (!["single", "multi"].includes(body.type)) errors.push("type must be 'single' or 'multi'");
  if (!["area", "list"].includes(body.audienceType)) errors.push("audienceType must be 'area' or 'list'");
  
  return errors;
};

// Validate redirect URL
const isAllowedRedirectHost = (url) => {
  try {
    const urlObj = new URL(url);
    return LANDIVO_ALLOWED_REDIRECT_HOSTS.some(host => 
      urlObj.hostname === host || urlObj.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
};

// POST /api/mailivo/automation
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const validationErrors = validateAutomationPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors
      });
    }

    const { sendType, ...automationData } = req.body;

    // Case 1: Send Now - Forward to Mailivo API
    if (sendType === "now") {
      try {
        const response = await axios.post(
          `${MAILIVO_API_BASE_URL}/automation/propertyUpload`,
          automationData,
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        return res.status(200).json({
          success: true,
          message: "Campaign sent successfully",
          data: response.data
        });
      } catch (mailivoError) {
        console.error("Mailivo API Error:", mailivoError.message);
        return res.status(502).json({
          success: false,
          error: "Failed to send campaign to Mailivo",
          details: mailivoError.response?.data || mailivoError.message
        });
      }
    }

    // Case 2: Send from Mailivo - Redirect to Mailivo frontend
    if (sendType === "mailivo") {
      try {
        // Call Mailivo API with redirect: "manual"
        const response = await axios.post(
          `${MAILIVO_API_BASE_URL}/automation/propertyUpload`,
          automationData,
          {
            timeout: 10000,
            maxRedirects: 0,
            validateStatus: (status) => status < 400, // Accept 3xx redirects
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        // Check for redirect in response
        let redirectUrl = null;

        // Method 1: Check Location header (303 See Other)
        if (response.status === 303 && response.headers.location) {
          redirectUrl = response.headers.location;
        }
        
        // Method 2: Check JSON response body
        if (!redirectUrl && response.data?.redirectTo) {
          redirectUrl = response.data.redirectTo;
        }

        // Method 3: Fallback - construct URL
        if (!redirectUrl) {
          // Build redirect URL with property and campaign data
          const params = new URLSearchParams({
            propertyId: automationData.propertyID,
            area: automationData.area,
            source: 'landivo'
          });
          redirectUrl = `${MAILIVO_FRONTEND_BASE_URL}/dashboard/landivo/campaigns/create?${params.toString()}`;
        }

        // Validate redirect URL for security
        if (!isAllowedRedirectHost(redirectUrl)) {
          console.error("Blocked redirect to unauthorized host:", redirectUrl);
          return res.status(403).json({
            success: false,
            error: "Redirect to unauthorized host blocked"
          });
        }

        // Return redirect URL to frontend
        return res.status(200).json({
          success: true,
          redirectUrl: redirectUrl
        });

      } catch (mailivoError) {
        console.error("Mailivo Redirect Error:", mailivoError.message);
        
        // Fallback: Return default Mailivo URL
        const fallbackUrl = `${MAILIVO_FRONTEND_BASE_URL}/dashboard/landivo/campaigns/create`;
        
        if (isAllowedRedirectHost(fallbackUrl)) {
          return res.status(200).json({
            success: true,
            redirectUrl: fallbackUrl,
            fallback: true
          });
        }

        return res.status(502).json({
          success: false,
          error: "Failed to get redirect from Mailivo"
        });
      }
    }

    // Invalid sendType
    return res.status(400).json({
      success: false,
      error: "Invalid sendType. Must be 'now' or 'mailivo'"
    });

  } catch (error) {
    console.error("Automation Route Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

export { router as mailivoAutomationRoute };