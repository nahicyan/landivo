// server/controllers/qualificationCntrl.js
import asyncHandler from "express-async-handler";
import nodemailer from "nodemailer";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { Buyer, Qualification, Property, Settings } from "../models/index.js";
import { handleFinanceQualificationEmailList } from "../services/qualification/financeQualificationEmailListService.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("qualificationCntrl");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

// Create a new qualification entry
export const createQualification = asyncHandler(async (req, res) => {
  try {
    const {
      propertyId,
      ownerId,
      propertyPrice,
      loanAmount,
      interestRate,
      monthlyPayment,
      downPayment,
      term,
      // Survey data
      language,
      homeUsage,
      realEstateAgent,
      homePurchaseTiming,
      currentHomeOwnership,
      currentOnAllPayments,
      downPaymentPercentage,
      employmentStatus,
      verifyIncome,
      incomeHistory,
      openCreditLines,
      totalMonthlyPayments,
      grossAnnualIncome,
      foreclosureForbearance,
      declaredBankruptcy,
      currentCreditScore,
      liensOrJudgments,
      // Personal info
      firstName,
      lastName,
      email,
      phone,
      buyerType,
      auth0Id,
      // Property info
      propertyAddress,
      propertyCity,
      propertyState,
      propertyZip,
      // Qualification status
      qualified,
    } = req.body;

    // Find or create buyer
    await connectMongo();
    const buyer = await findOrCreateBuyer({
      email,
      phone,
      firstName,
      lastName,
      auth0Id,
      buyerType
    });
    
    log.info(`Qualification for buyer: ${buyer.id}, ${buyer.firstName} ${buyer.lastName}`);

    // Check for disqualifying factors
    const disqualifiers = [];
    if (!qualified) {
      // Determine specific reason(s) for disqualification
      if (currentOnAllPayments === "No") disqualifiers.push("Payment history");
      if (foreclosureForbearance === "Yes") disqualifiers.push("Current foreclosure/forbearance"); 
      if (declaredBankruptcy === "Yes") disqualifiers.push("Recent bankruptcy");
      if (liensOrJudgments === "Yes") disqualifiers.push("Outstanding liens/judgments");
      
      if (currentCreditScore === "Poor (580-619)" || currentCreditScore === "Bad (Below 580)") 
        disqualifiers.push("Low credit score");
      
      if (verifyIncome === "No, I cannot" || verifyIncome === "No, I don't") 
        disqualifiers.push("Unable to verify income");
      
      if (incomeHistory === "No") 
        disqualifiers.push("Insufficient income history");
      
      if (grossAnnualIncome === "Less than $30,000" || grossAnnualIncome === "$30,000 - $50,000")
        disqualifiers.push("Insufficient income");
      
      // Down payment check
      if (propertyPrice && downPayment && (downPayment < propertyPrice * 0.1)) {
        disqualifiers.push("Insufficient down payment");
      }
    }

    // Create a new qualification entry
    const qualification = await Qualification.create({
      propertyId,
      ownerId: ownerId ? parseInt(ownerId) : null,
      propertyPrice: parseFloat(propertyPrice),
      loanAmount: loanAmount ? parseFloat(loanAmount) : null,
      interestRate: interestRate ? parseFloat(interestRate) : null,
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
      downPayment: downPayment ? parseFloat(downPayment) : null,
      term: term ? parseInt(term) : null,

      // Survey data
      language,
      homeUsage,
      realEstateAgent,
      homePurchaseTiming,
      currentHomeOwnership,
      currentOnAllPayments,
      employmentStatus,
      verifyIncome,
      incomeHistory,
      openCreditLines,
      totalMonthlyPayments: totalMonthlyPayments ? parseFloat(totalMonthlyPayments) : null,
      grossAnnualIncome,
      foreclosureForbearance,
      declaredBankruptcy,
      currentCreditScore,
      liensOrJudgments,

      // Personal info
      firstName,
      lastName,
      email,
      phone,

      // Status
      qualified,
      disqualificationReason: disqualifiers.length > 0 ? disqualifiers.join(", ") : null,

      // Property info
      propertyAddress,
      propertyCity,
      propertyState,
      propertyZip,
    });

    // Handle finance qualification email list management
    try {
      // Get property data - using AREA field, not city
      const propertyObjectId = toObjectId(propertyId);
      const property = propertyObjectId
        ? await Property.findById(propertyObjectId)
            .select("area city state")
            .lean()
        : null;

      if (property && buyer) {
        const emailListResult = await handleFinanceQualificationEmailList(
          buyer,
          property,
          "Finance Qualification"
        );
        log.info("Finance qualification email list result:", emailListResult);
      }
    } catch (emailListError) {
      log.error("Finance qualification email list management failed:", emailListError);
      // Don't fail qualification if email list fails
    }

    // Send email notification to administrators
    sendQualificationEmail(qualification);

    // Return success response
    res.status(201).json({
      message: "Qualification submitted successfully",
      qualification: {
        ...(qualification?.toObject ? qualification.toObject() : qualification),
        id: String(qualification._id),
      },
      qualified,
      buyer: {
        id: String(buyer._id),
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email
      }
    });
  } catch (error) {
    log.error("Error creating qualification:", error);
    res.status(500).json({
      message: "Failed to submit qualification",
      error: error.message
    });
  }
});


/**
 * Find existing buyer or create a new one
 */
async function findOrCreateBuyer(buyerData) {
  const { email, phone, buyerType, firstName, lastName, auth0Id } = buyerData;
  
  let buyer = null;
  let buyerFoundMethod = 'none';
  
  // First try to find buyer by Auth0 ID if provided
  if (auth0Id) {
    log.info(`Attempting to find buyer by Auth0 ID: ${auth0Id}`);
    buyer = await Buyer.findOne({ auth0Id });
    
    // If found by Auth0 ID, return early
    if (buyer) {
      buyerFoundMethod = 'auth0Id';
      log.info(`Buyer found by Auth0 ID: ${auth0Id}, buyerId: ${buyer.id}`);
      return buyer;
    }
  }
  
  // If not found by Auth0 ID, try email or phone
  log.info(`Attempting to find buyer by email: ${email} or phone: ${phone}`);
  buyer = await Buyer.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
  });

  if (buyer) {
    buyerFoundMethod = buyer.email.toLowerCase() === email.toLowerCase() ? 'email' : 'phone';
    log.info(`Buyer found by ${buyerFoundMethod}: buyerId: ${buyer.id}`);
    
    // If buyer found by email/phone but doesn't have Auth0 ID, update with Auth0 ID
    if (auth0Id && !buyer.auth0Id) {
      log.info(`Updating existing buyer (${buyer.id}) with Auth0 ID: ${auth0Id}`);
      buyer = await Buyer.findByIdAndUpdate(buyer._id, { auth0Id }, { new: true });
    }
  } else {
    // Create a new buyer if not found
    log.info(`No existing buyer found. Creating new buyer with email: ${email}, phone: ${phone}${auth0Id ? `, auth0Id: ${auth0Id}` : ''}`);
    buyer = await Buyer.create({
      email: email.toLowerCase(),
      phone,
      buyerType,
      firstName,
      lastName,
      source: "Qualification Lead",
      preferredAreas: [],
      preferredCity: [],
      preferredCounty: [],
      auth0Id: auth0Id || null,
    });
    buyerFoundMethod = 'created';
    log.info(`New buyer created with ID: ${buyer.id}`);
  }
  
  return buyer;
}

// Get qualifications for a specific property
export const getQualificationsForProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  
  try {
    await connectMongo();
    const qualifications = await Qualification.find({ propertyId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json(
      qualifications.map((qualification) => ({
        id: String(qualification._id),
        ...qualification,
      }))
    );
  } catch (error) {
    log.error("Error fetching qualifications:", error);
    res.status(500).json({
      message: "Failed to fetch qualifications",
      error: error.message
    });
  }
});

// Get all qualifications with pagination and filtering
export const getAllQualifications = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    qualified, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search = ''
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  try {
    // Build filter object
    await connectMongo();
    const where = {};
    
    // Add qualification filter if provided
    if (qualified !== undefined) {
      where.qualified = qualified === 'true';
    }
    
    // Add search functionality
    if (search) {
      const regex = new RegExp(search, 'i');
      where.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { propertyAddress: regex },
      ];
    }
    
    // Get total count for pagination
    const totalCount = await Qualification.countDocuments(where);
    
    // Get data with sorting
    const qualifications = await Qualification.find(where)
      .sort({ [sortBy]: sortOrder.toLowerCase() === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(take)
      .lean();
    
    res.status(200).json({
      qualifications: qualifications.map((qualification) => ({
        id: String(qualification._id),
        ...qualification,
      })),
      pagination: {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (error) {
    log.error("Error fetching qualifications:", error);
    res.status(500).json({
      message: "Failed to fetch qualifications",
      error: error.message
    });
  }
});

// Email notification for new qualifications
async function sendQualificationEmail(qualification) {
  try {
    // Get system settings to check if financing emails are enabled
    await connectMongo();
    const settings = await Settings.findOne().lean();
    
    // If settings don't exist or financing emails are disabled, skip sending
    if (!settings || !settings.enableFinancingEmails) {
      log.info('Financing email notifications are disabled in settings');
      return;
    }
    
    // Check if we have recipients
    if (!settings.financingEmailRecipients || settings.financingEmailRecipients.length === 0) {
      log.info('No financing email recipients configured');
      return;
    }
    
    // Check if we have SMTP configuration
    if (!settings.smtpServer || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword) {
      log.info('Incomplete SMTP configuration');
      return;
    }
    
    // Create transporter using settings from database
    const transporter = nodemailer.createTransport({
      host: settings.smtpServer,
      port: parseInt(settings.smtpPort),
      secure: parseInt(settings.smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword
      }
    });

    // Verify connection
    await transporter.verify();

    // Prepare email content
    const qualificationStatus = qualification.qualified ? "QUALIFIED" : "NOT QUALIFIED";
    const emailSubject = `Landivo: New ${qualificationStatus} Lead - ${qualification.firstName} ${qualification.lastName}`;
    
    // Format currency
    const formatCurrency = (value) => {
      return value ? `$${value.toLocaleString()}` : "N/A";
    };

    // Email HTML content with payment plan details
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: ${qualification.qualified ? '#2e7d32' : '#c62828'}">
          ${qualificationStatus} - Pre-Qualification Submission
        </h2>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Property Information</h3>
          <p><strong>Property ID:</strong> ${qualification.ownerId || 'N/A'}</p>
          <p><strong>Property Address:</strong> ${qualification.propertyAddress || 'N/A'}, ${qualification.propertyCity || ''}, ${qualification.propertyState || ''} ${qualification.propertyZip || ''}</p>
          <p><strong>Property Price:</strong> ${formatCurrency(qualification.propertyPrice)}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Selected Payment Plan</h3>
          <p><strong>Loan Amount:</strong> ${formatCurrency(qualification.loanAmount)}</p>
          <p><strong>Down Payment:</strong> ${formatCurrency(qualification.downPayment)}</p>
          <p><strong>Interest Rate:</strong> ${qualification.interestRate ? qualification.interestRate + '%' : 'N/A'}</p>
          <p><strong>Monthly Payment:</strong> ${formatCurrency(qualification.monthlyPayment)}/month</p>
          <p><strong>Term:</strong> ${qualification.term ? qualification.term + ' months' : 'N/A'}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Applicant Information</h3>
          <p><strong>Name:</strong> ${qualification.firstName} ${qualification.lastName}</p>
          <p><strong>Email:</strong> ${qualification.email}</p>
          <p><strong>Phone:</strong> ${qualification.phone}</p>
          <p><strong>Employment:</strong> ${qualification.employmentStatus || 'N/A'}</p>
          <p><strong>Credit Score:</strong> ${qualification.currentCreditScore || 'N/A'}</p>
          <p><strong>Annual Income:</strong> ${qualification.grossAnnualIncome || 'N/A'}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Survey Responses</h3>
          <p><strong>Home Usage:</strong> ${qualification.homeUsage || 'N/A'}</p>
          <p><strong>Current Home Ownership:</strong> ${qualification.currentHomeOwnership || 'N/A'}</p>
          <p><strong>Current on All Payments:</strong> ${qualification.currentOnAllPayments || 'N/A'}</p>
          <p><strong>Has Real Estate Agent:</strong> ${qualification.realEstateAgent || 'N/A'}</p>
          <p><strong>Purchase Timing:</strong> ${qualification.homePurchaseTiming || 'N/A'}</p>
          <p><strong>Income Verification:</strong> ${qualification.verifyIncome || 'N/A'}</p>
          <p><strong>Income History:</strong> ${qualification.incomeHistory || 'N/A'}</p>
          <p><strong>Open Credit Lines:</strong> ${qualification.openCreditLines || 'N/A'}</p>
          <p><strong>Monthly Debt:</strong> ${formatCurrency(qualification.totalMonthlyPayments || 0)}</p>
          <p><strong>Foreclosure/Forbearance:</strong> ${qualification.foreclosureForbearance || 'N/A'}</p>
          <p><strong>Declared Bankruptcy:</strong> ${qualification.declaredBankruptcy || 'N/A'}</p>
          <p><strong>Liens or Judgments:</strong> ${qualification.liensOrJudgments || 'N/A'}</p>
        </div>
        
        ${!qualification.qualified ? `
        <div style="margin-bottom: 20px; padding: 15px; background-color: #ffebee; border-radius: 5px; border-left: 4px solid #c62828;">
          <h3 style="margin-top: 0; color: #c62828;">Disqualification Reasons</h3>
          <p>${qualification.disqualificationReason || 'No specific reason provided'}</p>
        </div>` : ''}
        
        <p style="margin-top: 30px; font-size: 14px; color: #757575;">
          This is an automated message from the Landivo Pre-Qualification System.
        </p>
      </div>
    `;

    // Send email to all configured recipients
    const mailOptions = {
      from: `"Landivo Qualification" <${settings.smtpUser}>`,
      to: settings.financingEmailRecipients.join(', '),
      subject: emailSubject,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    log.info(`Qualification notification email sent to ${settings.financingEmailRecipients.length} recipients`);
  } catch (error) {
    log.error("Error sending qualification email:", error);
  }
}
