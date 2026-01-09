// server/controllers/propertyRowCntrl.js
import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { PropertyRow, Property } from "../models/index.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("propertyRowCntrl");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

// Get all property rows or filter by type
export const getPropertyRows = asyncHandler(async (req, res) => {
  try {
    const { rowType } = req.query;
    log.info(
      `[propertyRowCntrl:getPropertyRows] > [Request]: rowType=${rowType || "<none>"} > [Comment]: fetching rows`
    );

    // Filter by row type if provided
    const whereClause = rowType ? { rowType } : {};

    await connectMongo();
    const propertyRows = await PropertyRow.find(whereClause)
      .sort({ updatedAt: -1 })
      .lean();

    // If requesting featured rows, also include property details
    if (rowType === "featured" && propertyRows.length > 0) {
      const featuredRow = propertyRows[0];

      log.info(
        `[propertyRowCntrl:getPropertyRows] > [Request]: rowType=featured > [Response]: featuredRowId=${String(
          featuredRow._id
        )} displayOrderCount=${featuredRow.displayOrder.length} > [Comment]: fetching property details`
      );

      // Get property details for all IDs in the display order
      const propertyDetails = await Promise.all(
        featuredRow.displayOrder.map(async (propertyId) => {
          try {
            const propertyObjectId = toObjectId(propertyId);
            const property = propertyObjectId
              ? await Property.findById(
                  propertyObjectId,
                  "title streetAddress city state"
                ).lean()
              : null;
            return property
              ? { id: String(property._id), ...property }
              : { id: propertyId, title: "Unknown Property" };
          } catch (err) {
            return { id: propertyId, title: "Unknown Property" };
          }
        })
      );

      // Add property details to the response
      log.info(
        `[propertyRowCntrl:getPropertyRows] > [Response]: returning featured row with ${propertyDetails.length} propertyDetails`
      );
      return res.status(200).json({
        id: String(featuredRow._id),
        ...featuredRow,
        propertyDetails,
      });
    }

    log.info(
      `[propertyRowCntrl:getPropertyRows] > [Request]: rowType=${rowType || "<none>"} > [Response]: fullRowsReturned=${propertyRows.length}`
    );
    res.status(200).json(
      propertyRows.map((row) => ({
        id: String(row._id),
        ...row,
      }))
    );
  } catch (error) {
    log.error(`[propertyRowCntrl:getPropertyRows] > [Error]: ${error.message}`);
    res.status(500).json({ message: "Error fetching property rows", error: error.message });
  }
});

// Get a specific property row by ID
export const getPropertyRowById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    log.info(
      `[propertyRowCntrl:getPropertyRowById] > [Request]: id=${id} > [Comment]: fetching by ID`
    );
    await connectMongo();
    const rowId = toObjectId(id);
    if (!rowId) {
      return res.status(400).json({ message: "Invalid property row ID" });
    }
    const propertyRow = await PropertyRow.findById(rowId).lean();

    if (!propertyRow) {
      log.info(
        `[propertyRowCntrl:getPropertyRowById] > [Request]: id=${id} > [Response]: not found`
      );
      return res.status(404).json({ message: "Property row not found" });
    }

    // Get property details for properties in the row
    if (propertyRow.displayOrder && propertyRow.displayOrder.length > 0) {
      const propertyDetails = await Promise.all(
        propertyRow.displayOrder.map(async (propertyId) => {
          try {
            const propertyObjectId = toObjectId(propertyId);
            const property = propertyObjectId
              ? await Property.findById(
                  propertyObjectId,
                  "title streetAddress city state"
                ).lean()
              : null;
            return property
              ? { id: String(property._id), ...property }
              : { id: propertyId, title: "Unknown Property" };
          } catch (err) {
            return { id: propertyId, title: "Unknown Property" };
          }
        })
      );

      log.info(
        `[propertyRowCntrl:getPropertyRowById] > [Response]: id=${String(
          propertyRow._id
        )} displayOrderCount=${propertyRow.displayOrder.length}`
      );
      return res.status(200).json({
        id: String(propertyRow._id),
        ...propertyRow,
        propertyDetails,
      });
    }

    log.info(
      `[propertyRowCntrl:getPropertyRowById] > [Response]: id=${String(propertyRow._id)}`
    );
    res.status(200).json({ id: String(propertyRow._id), ...propertyRow });
  } catch (error) {
    log.error(`[propertyRowCntrl:getPropertyRowById] > [Error]: ${error.message}`);
    res.status(500).json({ message: "Error fetching property row", error: error.message });
  }
});

// Create a new property row
export const createPropertyRow = asyncHandler(async (req, res) => {
  try {
    log.info(
      `[propertyRowCntrl:createPropertyRow] > [Request]: name=${req.body.name || "<none>"} rowType=${req.body.rowType || "<none>"}`
    );
    const { name, rowType, sort, displayOrder } = req.body;

    await connectMongo();
    const propertyRow = await PropertyRow.create({
      name,
      rowType,
      sort: sort || "manual",
      displayOrder: displayOrder || [],
    });

    log.info(
      `[propertyRowCntrl:createPropertyRow] > [Response]: rowId=${String(propertyRow._id)}`
    );
    res.status(201).json({ id: String(propertyRow._id), ...propertyRow.toObject() });
  } catch (error) {
    log.error(`[propertyRowCntrl:createPropertyRow] > [Error]: ${error.message}`);
    res.status(500).json({ message: "Error creating property row", error: error.message });
  }
});

// Update a property row
export const updatePropertyRow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    log.info(
      `[propertyRowCntrl:updatePropertyRow] > [Request]: id=${id} updates=${JSON.stringify(req.body)}`
    );
    const { name, rowType, sort, displayOrder } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rowType !== undefined) updateData.rowType = rowType;
    if (sort !== undefined) updateData.sort = sort;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    await connectMongo();
    const rowId = toObjectId(id);
    if (!rowId) {
      return res.status(400).json({ message: "Invalid property row ID" });
    }
    const updatedRow = await PropertyRow.findByIdAndUpdate(
      rowId,
      updateData,
      { new: true }
    ).lean();

    if (!updatedRow) {
      return res.status(404).json({ message: "Property row not found" });
    }

    log.info(
      `[propertyRowCntrl:updatePropertyRow] > [Response]: rowId=${String(updatedRow._id)}`
    );
    res.status(200).json({ id: String(updatedRow._id), ...updatedRow });
  } catch (error) {
    log.error(`[propertyRowCntrl:updatePropertyRow] > [Error]: ${error.message}`);
    res.status(500).json({ message: "Error updating property row", error: error.message });
  }
});

// Delete a property row
export const deletePropertyRow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    log.info(`[propertyRowCntrl:deletePropertyRow] > [Request]: id=${id}`);
    await connectMongo();
    const rowId = toObjectId(id);
    if (!rowId) {
      return res.status(400).json({ message: "Invalid property row ID" });
    }
    const deleted = await PropertyRow.deleteOne({ _id: rowId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Property row not found" });
    }

    log.info(
      `[propertyRowCntrl:deletePropertyRow] > [Response]: rowId=${id} deleted`
    );
    res.status(200).json({ message: "Property row deleted successfully" });
  } catch (error) {
    log.error(`[propertyRowCntrl:deletePropertyRow] > [Error]: ${error.message}`);
    res.status(500).json({ message: "Error deleting property row", error: error.message });
  }
});
