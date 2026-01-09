// server/controllers/dealCntrl.js
import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { Buyer, Deal, Payment, Property } from "../models/index.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("dealCntrl");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

// Create a new deal
export const createDeal = asyncHandler(async (req, res) => {
  const {
    buyerId,
    propertyId,
    purchasePrice,
    salePrice,
    downPayment,
    interestRate,
    term,
    monthlyPayment,
    closingCosts,
    transferTaxes,
    appraisalValue,
    loanOriginationFee,
    financingType,
    startDate,
    notes,
    createdById
  } = req.body;

  // Validate required fields
  if (!buyerId || !propertyId || !purchasePrice || !salePrice || !downPayment || 
      !interestRate || !term || !monthlyPayment || !startDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Verify buyer and property exist
    await connectMongo();
    const buyerObjectId = toObjectId(buyerId);
    const propertyObjectId = toObjectId(propertyId);
    if (!buyerObjectId || !propertyObjectId) {
      return res.status(400).json({ message: "Invalid buyer or property ID" });
    }
    const buyer = await Buyer.findById(buyerObjectId).lean();
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    const property = await Property.findById(propertyObjectId).lean();
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Calculate loan amount
    const loanAmount = salePrice - downPayment;
    
    // Calculate total expected revenue
    const totalExpectedRevenue = downPayment + (monthlyPayment * term);

    const creatorId = toObjectId(createdById || req.userId);
    if (!creatorId) {
      return res.status(400).json({ message: "createdById is required" });
    }
    
    // Create the deal
    const deal = await Deal.create({
      buyerId: buyerObjectId,
      propertyId: propertyObjectId,
      createdById: creatorId,
      purchasePrice,
      salePrice,
      downPayment,
      loanAmount,
      interestRate,
      term,
      monthlyPayment,
      closingCosts: closingCosts || 0,
      transferTaxes: transferTaxes || 0,
      appraisalValue: appraisalValue || salePrice,
      loanOriginationFee: loanOriginationFee || 0,
      financingType: financingType || "Owner",
      status: "ACTIVE",
      startDate: new Date(startDate),
      totalExpectedRevenue,
      notes,
    });

    // Generate payment schedule
    const startDateObj = new Date(startDate);
    const payments = [];

    for (let i = 1; i <= term; i++) {
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      // Calculate amortization
      const remainingMonths = term - i + 1;
      const monthlyRate = interestRate / 100 / 12;
      const remainingPrincipal = loanAmount * Math.pow(1 + monthlyRate, remainingMonths) - 
                                (monthlyPayment * (Math.pow(1 + monthlyRate, remainingMonths) - 1) / monthlyRate);
      const interest = remainingPrincipal * monthlyRate;
      const principal = monthlyPayment - interest;
      
      payments.push({
        dealId: deal._id,
        paymentNumber: i,
        amount: monthlyPayment,
        dueDate,
        principal,
        interest,
        status: "PENDING"
      });
    }

    await Payment.insertMany(payments);

    // Update property status to sold
    await Property.updateOne(
      { _id: propertyObjectId },
      { $set: { status: "Sold" } }
    );

    res.status(201).json({
      message: "Deal created successfully",
      deal: {
        ...(deal?.toObject ? deal.toObject() : deal),
        id: String(deal._id),
      }
    });
  } catch (error) {
    log.error("Error creating deal:", error);
    res.status(500).json({
      message: "An error occurred while creating the deal",
      error: error.message
    });
  }
});

// Get all deals
export const getAllDeals = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    buyerId,
    propertyId,
    sort = "startDate",
    order = "desc" 
  } = req.query;
  
  try {
    await connectMongo();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build filter
    const where = {};
    if (status) where.status = status;
    if (buyerId) {
      const buyerObjectId = toObjectId(buyerId);
      where.buyerId = buyerObjectId || buyerId;
    }
    if (propertyId) {
      const propertyObjectId = toObjectId(propertyId);
      where.propertyId = propertyObjectId || propertyId;
    }
    
    // Get total count
    const totalCount = await Deal.countDocuments(where);
    
    // Get deals with relationships
    const deals = await Deal.find(where)
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone buyerType",
      })
      .populate({
        path: "propertyId",
        select: "title streetAddress city state zip imageUrls",
      })
      .sort({ [sort]: order.toLowerCase() === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(take)
      .lean();
    
    res.status(200).json({
      deals: deals.map((deal) => ({
        ...deal,
        id: String(deal._id),
        buyer: deal.buyerId
          ? {
              id: String(deal.buyerId._id),
              firstName: deal.buyerId.firstName,
              lastName: deal.buyerId.lastName,
              email: deal.buyerId.email,
              phone: deal.buyerId.phone,
              buyerType: deal.buyerId.buyerType,
            }
          : null,
        buyerId: deal.buyerId ? String(deal.buyerId._id) : String(deal.buyerId),
        property: deal.propertyId
          ? {
              id: String(deal.propertyId._id),
              title: deal.propertyId.title,
              streetAddress: deal.propertyId.streetAddress,
              city: deal.propertyId.city,
              state: deal.propertyId.state,
              zip: deal.propertyId.zip,
              imageUrls: deal.propertyId.imageUrls,
            }
          : null,
        propertyId: deal.propertyId
          ? String(deal.propertyId._id)
          : String(deal.propertyId),
      })),
      pagination: {
        totalCount,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (error) {
    log.error("Error fetching deals:", error);
    res.status(500).json({
      message: "An error occurred while fetching deals",
      error: error.message
    });
  }
});

// Get deal by ID
export const getDealById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    await connectMongo();
    const dealObjectId = toObjectId(id);
    if (!dealObjectId) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }
    const deal = await Deal.findById(dealObjectId)
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone buyerType",
      })
      .populate({
        path: "propertyId",
        select: "title streetAddress city state zip imageUrls",
      })
      .lean();
    
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const payments = await Payment.find({ dealId: dealObjectId })
      .sort({ paymentNumber: 1 })
      .lean();
    
    res.status(200).json({
      ...deal,
      id: String(deal._id),
      buyer: deal.buyerId
        ? {
            id: String(deal.buyerId._id),
            firstName: deal.buyerId.firstName,
            lastName: deal.buyerId.lastName,
            email: deal.buyerId.email,
            phone: deal.buyerId.phone,
            buyerType: deal.buyerId.buyerType,
          }
        : null,
      buyerId: deal.buyerId ? String(deal.buyerId._id) : String(deal.buyerId),
      property: deal.propertyId
        ? {
            id: String(deal.propertyId._id),
            title: deal.propertyId.title,
            streetAddress: deal.propertyId.streetAddress,
            city: deal.propertyId.city,
            state: deal.propertyId.state,
            zip: deal.propertyId.zip,
            imageUrls: deal.propertyId.imageUrls,
          }
        : null,
      propertyId: deal.propertyId
        ? String(deal.propertyId._id)
        : String(deal.propertyId),
      payments,
    });
  } catch (error) {
    log.error("Error fetching deal:", error);
    res.status(500).json({
      message: "An error occurred while fetching the deal",
      error: error.message
    });
  }
});

// Update deal
export const updateDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    status,
    completionDate,
    notes,
    paymentsReceived,
    totalPaidToDate,
    principalPaid,
    interestPaid,
    currentRevenue,
    profitLoss
  } = req.body;
  
  try {
    await connectMongo();
    const dealObjectId = toObjectId(id);
    if (!dealObjectId) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }
    const existingDeal = await Deal.findById(dealObjectId).lean();
    
    if (!existingDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    
    const updateData = {
      ...(status ? { status } : {}),
      ...(completionDate ? { completionDate: new Date(completionDate) } : {}),
      ...(notes ? { notes } : {}),
      ...(paymentsReceived !== undefined ? { paymentsReceived } : {}),
      ...(totalPaidToDate !== undefined ? { totalPaidToDate } : {}),
      ...(principalPaid !== undefined ? { principalPaid } : {}),
      ...(interestPaid !== undefined ? { interestPaid } : {}),
      ...(currentRevenue !== undefined ? { currentRevenue } : {}),
      ...(profitLoss !== undefined ? { profitLoss } : {}),
    };

    const updatedDeal = await Deal.findByIdAndUpdate(
      dealObjectId,
      updateData,
      { new: true }
    ).lean();
    
    res.status(200).json({
      message: "Deal updated successfully",
      deal: updatedDeal
        ? { id: String(updatedDeal._id), ...updatedDeal }
        : updatedDeal
    });
  } catch (error) {
    log.error("Error updating deal:", error);
    res.status(500).json({
      message: "An error occurred while updating the deal",
      error: error.message
    });
  }
});

// Record a payment
export const recordPayment = asyncHandler(async (req, res) => {
  const { dealId, paymentNumber, paymentDate, amount, lateFee } = req.body;
  
  try {
    // Find the payment
    await connectMongo();
    const dealObjectId = toObjectId(dealId);
    if (!dealObjectId) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }
    const payment = await Payment.findOne({
      dealId: dealObjectId,
      paymentNumber: parseInt(paymentNumber),
    }).lean();
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Get the deal
    const deal = await Deal.findById(dealObjectId).lean();
    
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    
    // Determine if payment is late
    const paymentDateObj = new Date(paymentDate);
    const dueDate = new Date(payment.dueDate);
    const isLate = paymentDateObj > dueDate;
    
    // Update the payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      payment._id,
      {
        paymentDate: paymentDateObj,
        status: isLate ? "LATE" : "PAID",
        lateFee: isLate ? (lateFee || 0) : 0,
        amount: amount || payment.amount,
      },
      { new: true }
    ).lean();
    
    // Update deal stats
    const actualAmount = (amount || payment.amount) + (isLate ? (lateFee || 0) : 0);
    
    const nextTotalPaid = deal.totalPaidToDate + actualAmount;
    const nextProfitLoss =
      deal.purchasePrice < nextTotalPaid
        ? nextTotalPaid - deal.purchasePrice
        : deal.purchasePrice - nextTotalPaid;

    await Deal.updateOne(
      { _id: dealObjectId },
      {
        $inc: {
          paymentsReceived: 1,
          paymentsOnTime: isLate ? 0 : 1,
          paymentsLate: isLate ? 1 : 0,
          totalPaidToDate: actualAmount,
          principalPaid: payment.principal,
          interestPaid: payment.interest,
          currentRevenue: actualAmount,
        },
        $set: {
          profitLoss: nextProfitLoss,
        },
      }
    );
    
    res.status(200).json({
      message: "Payment recorded successfully",
      payment: updatedPayment
        ? { id: String(updatedPayment._id), ...updatedPayment }
        : updatedPayment
    });
  } catch (error) {
    log.error("Error recording payment:", error);
    res.status(500).json({
      message: "An error occurred while recording the payment",
      error: error.message
    });
  }
});

// Get deal financial summary
export const getDealFinancialSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    await connectMongo();
    const dealObjectId = toObjectId(id);
    if (!dealObjectId) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }
    const deal = await Deal.findById(dealObjectId).lean();
    
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    const payments = await Payment.find({ dealId: dealObjectId }).lean();
    
    // Calculate metrics
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === "PAID" || p.status === "LATE").length;
    const remainingPayments = totalPayments - paidPayments;
    const remainingBalance = deal.loanAmount - deal.principalPaid;
    
    // Calculate projected completion date
    const lastPaymentDate = payments
      .filter(p => p.paymentDate)
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0]?.paymentDate;
    
    const projectedCompletionDate = payments
      .sort((a, b) => b.paymentNumber - a.paymentNumber)[0]?.dueDate;
    
    // Calculate ROI
    const totalInvestment = deal.purchasePrice + (deal.closingCosts || 0) + 
                          (deal.transferTaxes || 0) + (deal.loanOriginationFee || 0);
    const currentROI = ((deal.currentRevenue - totalInvestment) / totalInvestment) * 100;
    const projectedROI = ((deal.totalExpectedRevenue - totalInvestment) / totalInvestment) * 100;
    
    // Create summary
    const summary = {
      dealId: String(deal._id),
      salePrice: deal.salePrice,
      purchasePrice: deal.purchasePrice,
      downPayment: deal.downPayment,
      loanAmount: deal.loanAmount,
      interestRate: deal.interestRate,
      term: deal.term,
      monthlyPayment: deal.monthlyPayment,
      startDate: deal.startDate,
      status: deal.status,
      totalPayments,
      paidPayments,
      remainingPayments,
      totalPaidToDate: deal.totalPaidToDate,
      principalPaid: deal.principalPaid,
      interestPaid: deal.interestPaid,
      remainingBalance,
      currentRevenue: deal.currentRevenue,
      totalExpectedRevenue: deal.totalExpectedRevenue,
      profitLoss: deal.profitLoss,
      currentROI,
      projectedROI,
      lastPaymentDate,
      projectedCompletionDate,
      completionDate: deal.completionDate
    };
    
    res.status(200).json(summary);
  } catch (error) {
    log.error("Error fetching deal summary:", error);
    res.status(500).json({
      message: "An error occurred while fetching the deal summary",
      error: error.message
    });
  }
});
