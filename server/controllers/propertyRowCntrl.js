// server/controllers/propertyRowCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

// Get all property rows or filter by type
export const getPropertyRows = asyncHandler(async (req, res) => {
  try {
    const { rowType } = req.query;
    
    // Filter by row type if provided
    const whereClause = rowType ? { rowType } : {};
    
    const propertyRows = await prisma.propertyRow.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
    });
    
    // If requesting featured rows, also include property details
    if (rowType === 'featured' && propertyRows.length > 0) {
      const featuredRow = propertyRows[0];
      
      // Get property details for all IDs in the display order
      const propertyDetails = await Promise.all(
        featuredRow.displayOrder.map(async (propertyId) => {
          try {
            const property = await prisma.residency.findUnique({
              where: { id: propertyId },
              select: {
                id: true,
                title: true,
                streetAddress: true,
                city: true,
                state: true,
              },
            });
            return property || { id: propertyId, title: "Unknown Property" };
          } catch (err) {
            return { id: propertyId, title: "Unknown Property" };
          }
        })
      );
      
      // Add property details to the response
      return res.status(200).json({
        ...featuredRow,
        propertyDetails,
      });
    }
    
    res.status(200).json(propertyRows);
  } catch (error) {
    console.error("Error fetching property rows:", error);
    res.status(500).json({ message: "Error fetching property rows", error: error.message });
  }
});

// Get a specific property row by ID
export const getPropertyRowById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const propertyRow = await prisma.propertyRow.findUnique({
      where: { id }
    });
    
    if (!propertyRow) {
      return res.status(404).json({ message: "Property row not found" });
    }
    
    // Get property details for properties in the row
    if (propertyRow.displayOrder && propertyRow.displayOrder.length > 0) {
      const propertyDetails = await Promise.all(
        propertyRow.displayOrder.map(async (propertyId) => {
          try {
            const property = await prisma.residency.findUnique({
              where: { id: propertyId },
              select: {
                id: true,
                title: true,
                streetAddress: true,
                city: true,
                state: true,
              },
            });
            return property || { id: propertyId, title: "Unknown Property" };
          } catch (err) {
            return { id: propertyId, title: "Unknown Property" };
          }
        })
      );
      
      return res.status(200).json({
        ...propertyRow,
        propertyDetails,
      });
    }
    
    res.status(200).json(propertyRow);
  } catch (error) {
    console.error("Error fetching property row:", error);
    res.status(500).json({ message: "Error fetching property row", error: error.message });
  }
});

// Create a new property row
export const createPropertyRow = asyncHandler(async (req, res) => {
  try {
    const { name, rowType, sort, displayOrder } = req.body;
    
    const propertyRow = await prisma.propertyRow.create({
      data: {
        name,
        rowType,
        sort: sort || "manual",
        displayOrder: displayOrder || []
      }
    });
    
    res.status(201).json(propertyRow);
  } catch (error) {
    console.error("Error creating property row:", error);
    res.status(500).json({ message: "Error creating property row", error: error.message });
  }
});

// Update a property row
export const updatePropertyRow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const { name, rowType, sort, displayOrder } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rowType !== undefined) updateData.rowType = rowType;
    if (sort !== undefined) updateData.sort = sort;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    
    const updatedRow = await prisma.propertyRow.update({
      where: { id },
      data: updateData
    });
    
    res.status(200).json(updatedRow);
  } catch (error) {
    console.error("Error updating property row:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Property row not found" });
    }
    
    res.status(500).json({ message: "Error updating property row", error: error.message });
  }
});

// Delete a property row
export const deletePropertyRow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.propertyRow.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Property row deleted successfully" });
  } catch (error) {
    console.error("Error deleting property row:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Property row not found" });
    }
    
    res.status(500).json({ message: "Error deleting property row", error: error.message });
  }
});