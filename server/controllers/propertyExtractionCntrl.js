import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

// Get all property extractions with pagination and filters
export const getAllPropertyExtractions = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    email_uid = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Search across property address and subject
  if (search) {
    where.OR = [
      { property_address: { contains: search, mode: 'insensitive' } },
      { raw_property_address: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Filter by email UID
  if (email_uid) {
    where.email_uid = email_uid;
  }

  const [properties, total] = await Promise.all([
    prisma.propertyExtraction.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.propertyExtraction.count({ where })
  ]);

  res.json({
    success: true,
    data: properties,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get single property extraction by ID
export const getPropertyExtractionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const property = await prisma.propertyExtraction.findUnique({
    where: { id }
  });

  if (!property) {
    return res.status(404).json({ 
      success: false, 
      message: 'Property extraction not found' 
    });
  }

  res.json({ success: true, data: property });
});

// Delete property extraction
export const deletePropertyExtraction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.propertyExtraction.delete({
    where: { id }
  });

  res.json({ success: true, message: 'Property extraction deleted' });
});