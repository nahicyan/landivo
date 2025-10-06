// server/controllers/residencyCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to manage multiple property rows
const managePropertyRowsDisplayOrder = async (propertyId, propertyRows) => {
  try {
    // 1) Fetch every row that currently contains this property
    const existingRows = await prisma.propertyRow.findMany({
      where: { displayOrder: { has: propertyId } },
    });
    const existingRowIds = existingRows.map((r) => r.id);

    // 2) Figure out which of those to delete (i.e. not in the new list)
    const newRowIds = Array.isArray(propertyRows) ? propertyRows.map((r) => r.rowId) : [];

    const rowsToRemove = existingRowIds.filter((id) => !newRowIds.includes(id));
    for (const rowId of rowsToRemove) {
      const row = existingRows.find((r) => r.id === rowId);
      const updatedOrder = row.displayOrder.filter((id) => id !== propertyId);
      await prisma.propertyRow.update({
        where: { id: rowId },
        data: { displayOrder: updatedOrder },
      });
      console.log(`Removed property ${propertyId} from row ${rowId}`);
    }

    // 3) Now handle all the additions/reorders
    if (Array.isArray(propertyRows)) {
      for (const rowSelection of propertyRows) {
        const { rowId, position } = rowSelection;

        if (!rowId) {
          console.warn("Invalid row ID provided");
          continue;
        }

        // Find the specified row
        const row = await prisma.propertyRow.findUnique({
          where: { id: rowId },
        });

        if (!row) {
          console.warn(`Property row with ID ${rowId} not found`);
          continue;
        }

        // Get the current display order
        const currentOrder = [...(row.displayOrder || [])];

        // Remove the property from its current position if it exists
        const updatedOrder = currentOrder.filter((id) => id !== propertyId);

        // Validate the desired position
        const desiredPosition = position !== undefined ? Math.min(Math.max(0, position), updatedOrder.length) : updatedOrder.length; // Default to the end of the list

        // Insert at the desired position
        updatedOrder.splice(desiredPosition, 0, propertyId);

        // Update the PropertyRow with the new order
        await prisma.propertyRow.update({
          where: { id: rowId },
          data: { displayOrder: updatedOrder },
        });

        console.log(`Updated display order for property ${propertyId} in row ${rowId} to position ${desiredPosition}`);
      }
    }
  } catch (error) {
    console.error("Error managing property rows display order:", error);
  }
};

// Helper function to manage property display order
const manageFeaturedDisplayOrder = async (propertyId, isFeatured, displayPosition) => {
  try {
    // Find PropertyRow for featured properties
    let featuredRow = await prisma.propertyRow.findFirst({
      where: { rowType: "featured" },
    });

    // If property is not featured, remove it from the display order
    if (!isFeatured && featuredRow) {
      // Remove property ID from displayOrder if present
      const updatedOrder = featuredRow.displayOrder.filter((id) => id !== propertyId);

      await prisma.propertyRow.update({
        where: { id: featuredRow.id },
        data: { displayOrder: updatedOrder },
      });
      console.log(`Removed property ${propertyId} from featured display order`);
      return;
    }

    // If property is featured but no row exists (edge case), just return
    if (isFeatured && !featuredRow) {
      console.warn("Failed to create featured row");
      return;
    }

    // At this point, property is featured and featuredRow exists
    const currentOrder = [...featuredRow.displayOrder];
    const currentPosition = currentOrder.indexOf(propertyId);

    // Remove the property from its current position if it exists
    if (currentPosition !== -1) {
      currentOrder.splice(currentPosition, 1);
    }

    // Validate the desired position
    const desiredPosition = displayPosition !== undefined ? Math.min(Math.max(0, displayPosition), currentOrder.length) : currentOrder.length; // Default to the end of the list

    // Insert at the desired position
    currentOrder.splice(desiredPosition, 0, propertyId);

    // Update the PropertyRow with the new order
    await prisma.propertyRow.update({
      where: { id: featuredRow.id },
      data: { displayOrder: currentOrder },
    });

    console.log(`Updated featured display order for property ${propertyId} to position ${desiredPosition}`);
  } catch (error) {
    console.error("Error managing featured display order:", error);
  }
};

// Get All Properties
export const getAllResidencies = asyncHandler(async (req, res) => {
  try {
    const residencies = await prisma.residency.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    res.status(200).send(residencies);
  } catch (error) {
    console.error("Error fetching residencies:", error);
    res.status(500).send({
      message: "An error occurred while fetching residencies",
      error: error.message,
    });
  }
});

// Get A Specific Property
export const getResidency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const residency = await prisma.residency.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    res.send(residency);
  } catch (err) {
    console.error("Error fetching residency:", err);
    res.status(500).send({
      message: "An error occurred while fetching the residency",
      error: err.message,
    });
  }
});

// Update a Property
export const updateResidency = asyncHandler(async (req, res) => {
  console.log("Received updateResidency request body:", req.body);
  try {
    const { id } = req.params;
    let { imageUrls, videoUrls, viewCount, removeCmaFile, propertyRows, featuredPosition, profileId, toggleObscure, ...restOfData } = req.body;
    // Get the authenticated user's ID from the req object (set by middleware)
    const updatedById = req.userId;

    if (!updatedById) {
      return res.status(401).json({ message: "Unauthorized. User not authenticated." });
    }

    // Remove non-updatable fields
    delete restOfData.id;
    delete restOfData.createdAt;
    delete restOfData.updatedAt;
    delete restOfData.createdById;

    // Get the current property to track changes
    const currentProperty = await prisma.residency.findUnique({
      where: { id },
    });

    if (!currentProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Convert numeric fields
    if (restOfData.ownerId) restOfData.ownerId = parseInt(restOfData.ownerId, 10);
    if (restOfData.latitude) restOfData.latitude = parseFloat(restOfData.latitude);
    if (restOfData.longitude) restOfData.longitude = parseFloat(restOfData.longitude);
    if (restOfData.sqft) restOfData.sqft = parseInt(restOfData.sqft, 10);
    if (restOfData.askingPrice) restOfData.askingPrice = parseFloat(restOfData.askingPrice);
    if (restOfData.minPrice) restOfData.minPrice = parseFloat(restOfData.minPrice);
    if (restOfData.disPrice) restOfData.disPrice = parseFloat(restOfData.disPrice);
    if (restOfData.acre) restOfData.acre = parseFloat(restOfData.acre);
    if (restOfData.hoaFee) restOfData.hoaFee = parseFloat(restOfData.hoaFee);

    // Payment Fields
    if (restOfData.tax) restOfData.tax = parseFloat(restOfData.tax);
    if (restOfData.hoaMonthly) restOfData.hoaMonthly = parseFloat(restOfData.hoaMonthly);
    if (restOfData.serviceFee) restOfData.serviceFee = parseFloat(restOfData.serviceFee);
    if (restOfData.term) restOfData.term = parseInt(restOfData.term, 10);
    if (restOfData.interestOne) restOfData.interestOne = parseFloat(restOfData.interestOne);
    if (restOfData.interestTwo) restOfData.interestTwo = parseFloat(restOfData.interestTwo);
    if (restOfData.interestThree) restOfData.interestThree = parseFloat(restOfData.interestThree);
    if (restOfData.monthlyPaymentOne) restOfData.monthlyPaymentOne = parseFloat(restOfData.monthlyPaymentOne);
    if (restOfData.monthlyPaymentTwo) restOfData.monthlyPaymentTwo = parseFloat(restOfData.monthlyPaymentTwo);
    if (restOfData.monthlyPaymentThree) restOfData.monthlyPaymentThree = parseFloat(restOfData.monthlyPaymentThree);
    if (restOfData.downPaymentOne) restOfData.downPaymentOne = parseFloat(restOfData.downPaymentOne);
    if (restOfData.downPaymentTwo) restOfData.downPaymentTwo = parseFloat(restOfData.downPaymentTwo);
    if (restOfData.downPaymentThree) restOfData.downPaymentThree = parseFloat(restOfData.downPaymentThree);
    if (restOfData.loanAmountOne) restOfData.loanAmountOne = parseFloat(restOfData.loanAmountOne);
    if (restOfData.loanAmountTwo) restOfData.loanAmountTwo = parseFloat(restOfData.loanAmountTwo);
    if (restOfData.loanAmountThree) restOfData.loanAmountThree = parseFloat(restOfData.loanAmountThree);
    if (restOfData.purchasePrice) restOfData.purchasePrice = parseFloat(restOfData.purchasePrice);
    if (restOfData.financedPrice) restOfData.financedPrice = parseFloat(restOfData.financedPrice);

    // Handle landType as an array
    if (restOfData.landType) {
      restOfData.landType = Array.isArray(restOfData.landType) ? restOfData.landType : [restOfData.landType];
    }

    // Process the "imageUrls" field (expected as JSON-stringified array)
    let finalExistingImages = [];
    if (imageUrls) {
      try {
        finalExistingImages = JSON.parse(imageUrls);
        if (!Array.isArray(finalExistingImages)) {
          finalExistingImages = [];
        }
      } catch (error) {
        finalExistingImages = [];
      }
    }

    // Process the "videoUrls" field (expected as JSON-stringified array)
    let finalExistingVideos = [];
    if (videoUrls) {
      try {
        finalExistingVideos = JSON.parse(videoUrls);
        if (!Array.isArray(finalExistingVideos)) {
          finalExistingVideos = [];
        }
      } catch (error) {
        finalExistingVideos = [];
      }
    }

    // Boolean Conversion
    if (restOfData.landId !== undefined) {
      restOfData.landId = restOfData.landId === true || restOfData.landId === "true" || restOfData.landId === "included";
    }

    // Add toggleObscure conversion
    if (toggleObscure !== undefined) {
      restOfData.toggleObscure = toggleObscure === true || toggleObscure === "true";
    }

    // Process newly uploaded images (if any) from multer
    let newImagePaths = [];
    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      // Use relative path: "uploads/" + file.filename
      newImagePaths = req.files["images"].map((file) => "uploads/" + file.filename);
    }

    // Process newly uploaded videos (if any) from multer
    let newVideoPaths = [];
    if (req.files && req.files["videos"] && req.files["videos"].length > 0) {
      // Use relative path: "uploads/" + file.filename
      newVideoPaths = req.files["videos"].map((file) => "uploads/" + file.filename);
    }

    // Merge existing images with new image paths
    const finalImageUrls = [...finalExistingImages, ...newImagePaths];

    // Merge existing videos with new video paths
    const finalVideoUrls = [...finalExistingVideos, ...newVideoPaths];

    // Handle CMA fields
    if (restOfData.hasCma !== undefined) {
      restOfData.hasCma = restOfData.hasCma === "true" || restOfData.hasCma === true;
    }

    // Handle CMA file management
    let cmaFilePath = currentProperty.cmaFilePath;

    // Check if we need to remove the existing CMA file
    if (req.body.removeCmaFile === "true") {
      // Delete the physical file if it exists
      if (currentProperty.cmaFilePath) {
        const oldFilePath = path.join(__dirname, "../", currentProperty.cmaFilePath);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`Deleted old CMA file: ${oldFilePath}`);
          }
        } catch (err) {
          console.error(`Error deleting old CMA file: ${err.message}`);
        }
      }
      // Set the path to null for database update
      cmaFilePath = null;
    }
    // Check if we're uploading a new CMA file
    else if (req.files && req.files["cmaFile"] && req.files["cmaFile"].length > 0) {
      cmaFilePath = "uploads/" + req.files["cmaFile"][0].filename;

      // Delete the old file if it exists
      if (currentProperty.cmaFilePath) {
        const oldFilePath = path.join(__dirname, "../", currentProperty.cmaFilePath);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`Deleted old CMA file: ${oldFilePath}`);
          }
        } catch (err) {
          console.error(`Error deleting old CMA file: ${err.message}`);
        }
      }
    }

    // Create a modification record
    const modification = {
      timestamp: new Date(),
      userId: updatedById,
      action: "update",
      changes: {},
    };

    // Track changes for each field
    for (const key in restOfData) {
      if (JSON.stringify(currentProperty[key]) !== JSON.stringify(restOfData[key])) {
        modification.changes[key] = {
          from: currentProperty[key],
          to: restOfData[key],
        };
      }
    }

    // Get existing modification history
    const modificationHistory = currentProperty.modificationHistory || [];

    // Only add to history if there are changes
    if (Object.keys(modification.changes).length > 0) {
      modificationHistory.push(modification);
    }

    // Prepare update data
    const updateData = {
      ...restOfData,
      imageUrls: finalImageUrls,
      videoUrls: finalVideoUrls,
      updatedBy: { connect: { id: updatedById } },
      profileId: profileId || currentProperty.profileId,
      modificationHistory,
      cmaFilePath,
      profileId: profileId || currentProperty.profileId, // Add the profileId field
    };

    const updatedResidency = await prisma.residency.update({
      where: { id },
      data: updateData,
    });

    // Handle property rows data
    let parsedPropertyRows = [];
    if (propertyRows) {
      try {
        // Handle different formats for propertyRows data
        if (typeof propertyRows === "string") {
          // Handle malformed [object Object] string
          if (propertyRows === "[object Object]" || propertyRows.startsWith("[object Object]")) {
            console.log("Received malformed propertyRows data. Attempting to extract from selected rows data.");

            // Try to recover using featuredPosition array if available
            if (featuredPosition && (Array.isArray(featuredPosition) || typeof featuredPosition === "string")) {
              const positions = Array.isArray(featuredPosition) ? featuredPosition : [featuredPosition];

              // Get featured row information from database
              const featuredRows = await prisma.propertyRow.findMany({
                where: { rowType: "featured" },
              });

              if (featuredRows.length > 0) {
                parsedPropertyRows = featuredRows.map((row, index) => {
                  return {
                    rowId: row.id,
                    position: parseInt(positions[index] || 0, 10),
                  };
                });
              }
            }
          }
          // Try standard JSON parsing
          else {
            try {
              parsedPropertyRows = JSON.parse(propertyRows);
            } catch (e) {
              console.error("Error parsing propertyRows JSON:", e);
              // Fallback to empty array
              parsedPropertyRows = [];
            }
          }
        }
        // If already an object/array, use directly
        else if (typeof propertyRows === "object") {
          parsedPropertyRows = Array.isArray(propertyRows) ? propertyRows : [propertyRows];
        }
      } catch (error) {
        console.error("Error parsing propertyRows:", error);
      }
    }

    // Update property rows if we have valid data
    if (Array.isArray(parsedPropertyRows)) {
      // will handle both non-empty (re-order) and empty (removal) cases
      await managePropertyRowsDisplayOrder(id, parsedPropertyRows);
    }
    // For backward compatibility - ONLY IF NO VALID PROPERTY ROWS
    else if (restOfData.featured === "Featured" || restOfData.featured === "Yes") {
      const featPos = featuredPosition !== undefined ? (Array.isArray(featuredPosition) ? parseInt(featuredPosition[0], 10) : parseInt(featuredPosition, 10)) : undefined;

      await manageFeaturedDisplayOrder(id, true, featPos);
    }

    return res.status(200).json(updatedResidency);
  } catch (error) {
    console.error("Error updating residency:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Residency with this ID does not exist",
        error: error.message,
      });
    }
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Unique constraint violation—some field must be unique",
        error: error.message,
      });
    }
    if (error.code === "P2003") {
      return res.status(400).json({
        message: "Foreign key constraint failed—invalid relation",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update property",
      error: error.message,
    });
  }
});

// Get Property Images
export const getResidencyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const residency = await prisma.residency.findUnique({
      where: { id },
    });

    if (!residency || !residency.imageUrls) {
      return res.status(404).json({ message: "No images found for this residency" });
    }

    res.status(200).json({
      message: "Images retrieved successfully",
      images: residency.imageUrls,
    });
  } catch (error) {
    console.error("Error fetching residency images:", error);
    res.status(500).json({
      message: "Failed to retrieve images",
      error: error.message,
    });
  }
});

// Get Property Videos
export const getResidencyVideos = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const residency = await prisma.residency.findUnique({
      where: { id },
    });

    if (!residency || !residency.videoUrls) {
      return res.status(404).json({ message: "No videos found for this residency" });
    }

    res.status(200).json({
      message: "Videos retrieved successfully",
      videos: residency.videoUrls,
    });
  } catch (error) {
    console.error("Error fetching residency videos:", error);
    res.status(500).json({
      message: "Failed to retrieve videos",
      error: error.message,
    });
  }
});

// Create Property with Multiple Files
export const createResidencyWithMultipleFiles = asyncHandler(async (req, res) => {
  console.log("This is creation request body: ", req.body);
  try {
    // Get the authenticated user's ID from the req object (set by middleware)
    const createdById = req.userId;

    if (!createdById) {
      return res.status(401).json({ message: "Unauthorized. User not authenticated." });
    }

    // Collect all uploaded image files
    let imagePaths = [];
    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      imagePaths = req.files["images"].map((file) => "uploads/" + file.filename);
    }

    // Collect all uploaded video files
    let videoPaths = [];
    if (req.files && req.files["videos"] && req.files["videos"].length > 0) {
      videoPaths = req.files["videos"].map((file) => "uploads/" + file.filename);
    }

    // Handle CMA file upload (single file)
    let cmaFilePath = null;
    if (req.files && req.files["cmaFile"] && req.files["cmaFile"].length > 0) {
      cmaFilePath = "uploads/" + req.files["cmaFile"][0].filename;
    }

    // Process existing imageUrls from req.body (if any)
    let existingImages = [];
    if (req.body.imageUrls) {
      try {
        existingImages = JSON.parse(req.body.imageUrls);
        if (!Array.isArray(existingImages)) existingImages = [];
      } catch (err) {
        existingImages = [];
      }
    }

    // Process existing videoUrls from req.body (if any)
    let existingVideos = [];
    if (req.body.videoUrls) {
      try {
        existingVideos = JSON.parse(req.body.videoUrls);
        if (!Array.isArray(existingVideos)) existingVideos = [];
      } catch (err) {
        existingVideos = [];
      }
    }

    // Merge existing images with the new image paths
    const allImageUrls = [...existingImages, ...imagePaths];

    // Merge existing videos with the new video paths
    const allVideoUrls = [...existingVideos, ...videoPaths];

    // Destructure the fields from req.body
    const {
      //System Info
      ownerId,
      area,
      status,
      featured,
      featuredPosition,
      propertyRows,
      profileId, // Add the new profileId field

      // Listing Details
      title,
      description,
      notes,

      // Classification
      type,
      landType, // Now an array field
      legalDescription,
      zoning,
      restrictions,
      mobileHomeFriendly,
      hoaPoa,
      hoaFee,
      hoaPaymentTerms,
      survey,

      // Address and Location
      direction,
      streetAddress,
      city,
      county,
      state,
      zip,
      latitude,
      longitude,
      apnOrPin,
      landIdLink,
      landId,

      // Dimensions
      sqft,
      acre,

      // Pricing and Financing
      askingPrice,
      minPrice,
      disPrice,

      // Financing and Payment Calculation
      financing,
      financingTwo,
      financingThree,
      tax,
      closingDate, 
      hoaMonthly,
      serviceFee,
      term,
      interestOne,
      interestTwo,
      interestThree,
      monthlyPaymentOne,
      monthlyPaymentTwo,
      monthlyPaymentThree,
      downPaymentOne,
      downPaymentTwo,
      downPaymentThree,
      loanAmountOne,
      loanAmountTwo,
      loanAmountThree,
      purchasePrice,
      financedPrice,

      // Utilities and Infrastructure
      water,
      sewer,
      electric,
      roadCondition,
      floodplain,

      //Media & Tags
      ltag,
      rtag,

      // Display
      toggleObscure,

      // CMA fields
      hasCma,
      cmaData,
    } = req.body;

    // Prepare landType as an array
    let landTypeArray = [];
    if (landType) {
      try {
        // Handle different input formats: string, array, or JSON string
        if (typeof landType === "string") {
          // Try to parse as JSON if it looks like an array
          if (landType.startsWith("[") && landType.endsWith("]")) {
            landTypeArray = JSON.parse(landType);
          } else {
            // Single string value
            landTypeArray = [landType];
          }
        } else if (Array.isArray(landType)) {
          landTypeArray = landType;
        }
      } catch (error) {
        console.error("Error processing landType:", error);
        landTypeArray = typeof landType === "string" ? [landType] : [];
      }
    }

    // Create the residency with the array of image URLs and video URLs stored
    const residency = await prisma.residency.create({
      data: {
        // Connect to the creating user
        createdBy: {
          connect: { id: createdById },
        },
        updatedBy: {
          connect: { id: createdById },
        },

        // System Info
        ownerId: ownerId ? parseInt(ownerId) : null,
        area,
        status,
        featured: featured ?? "Not Featured",
        profileId: profileId || null, // Add the profileId field

        // Listing Details
        title,
        description: description ?? null,
        notes: notes ?? null,

        // Classification
        type: type ?? null,
        landType: landTypeArray,
        legalDescription: legalDescription ?? null,
        zoning: zoning ?? null,
        restrictions: restrictions ?? null,
        mobileHomeFriendly: mobileHomeFriendly ?? null,
        hoaPoa: hoaPoa ?? null,
        hoaFee: hoaFee ? parseFloat(hoaFee) : null,
        hoaPaymentTerms: hoaPaymentTerms ?? null,
        survey: survey ?? null,

        // Location
        streetAddress,
        city,
        county,
        state,
        zip,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        apnOrPin,
        direction: direction ?? null,
        landIdLink: landIdLink ?? null,
        landId: landId === true || landId === "true" || landId === "included",

        // Dimensions
        sqft: parseInt(sqft),
        acre: acre ? parseFloat(acre) : null,

        // Pricing
        askingPrice: parseFloat(askingPrice),
        minPrice: parseFloat(minPrice),
        disPrice: disPrice ? parseFloat(disPrice) : null,

        // Financing and Payment Calculation
        financing: financing ?? "Not-Available",
        financingTwo: financingTwo ?? "Not-Available",
        financingThree: financingThree ?? "Not-Available",
        tax: tax ? parseFloat(tax) : null,
        closingDate: closingDate ? new Date(closingDate) : null,
        hoaMonthly: hoaMonthly ? parseFloat(hoaMonthly) : null,
        serviceFee: serviceFee ? parseFloat(serviceFee) : null,
        term: term ? parseInt(term, 10) : null,
        interestOne: interestOne ? parseFloat(interestOne) : null,
        interestTwo: interestTwo ? parseFloat(interestTwo) : null,
        interestThree: interestThree ? parseFloat(interestThree) : null,
        monthlyPaymentOne: monthlyPaymentOne ? parseFloat(monthlyPaymentOne) : null,
        monthlyPaymentTwo: monthlyPaymentTwo ? parseFloat(monthlyPaymentTwo) : null,
        monthlyPaymentThree: monthlyPaymentThree ? parseFloat(monthlyPaymentThree) : null,
        downPaymentOne: downPaymentOne ? parseFloat(downPaymentOne) : null,
        downPaymentTwo: downPaymentTwo ? parseFloat(downPaymentTwo) : null,
        downPaymentThree: downPaymentThree ? parseFloat(downPaymentThree) : null,
        loanAmountOne: loanAmountOne ? parseFloat(loanAmountOne) : null,
        loanAmountTwo: loanAmountTwo ? parseFloat(loanAmountTwo) : null,
        loanAmountThree: loanAmountThree ? parseFloat(loanAmountThree) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        financedPrice: financedPrice ? parseFloat(financedPrice) : null,

        // Utilities
        water: water ?? null,
        sewer: sewer ?? null,
        electric: electric ?? null,
        roadCondition: roadCondition ?? null,
        floodplain: floodplain ?? null,

        // Media & Tags
        ltag: ltag ?? null,
        rtag: rtag ?? null,
        imageUrls: allImageUrls.length > 0 ? allImageUrls : null,
        videoUrls: allVideoUrls.length > 0 ? allVideoUrls : null,

        // Display
        toggleObscure: toggleObscure === "true" || toggleObscure === true,

        // CMA fields
        hasCma: hasCma === "true" || hasCma === true,
        cmaData: cmaData || null,
        cmaFilePath: cmaFilePath,

        //Profile
        profileId: req.body.profileId || null,

        // Initialize modification history as an empty array
        modificationHistory: [],
      },
    });

    // Handle property rows data
    let parsedPropertyRows = [];
    if (propertyRows) {
      try {
        // Handle different formats for propertyRows data
        if (typeof propertyRows === "string") {
          // Handle malformed [object Object] string
          if (propertyRows === "[object Object]" || propertyRows.startsWith("[object Object]")) {
            console.log("Received malformed propertyRows data. Attempting to extract from featuredPosition array.");

            // Try to recover using featuredPosition array if available
            if (featuredPosition && (Array.isArray(featuredPosition) || typeof featuredPosition === "string")) {
              const positions = Array.isArray(featuredPosition) ? featuredPosition : [featuredPosition];

              // Get featured row information from database
              const featuredRows = await prisma.propertyRow.findMany({
                where: { rowType: "featured" },
              });

              if (featuredRows.length > 0) {
                parsedPropertyRows = featuredRows.map((row, index) => {
                  return {
                    rowId: row.id,
                    position: parseInt(positions[index] || 0, 10),
                  };
                });
              }
            }
          }
          // Try standard JSON parsing
          else {
            try {
              parsedPropertyRows = JSON.parse(propertyRows);
            } catch (e) {
              console.error("Error parsing propertyRows JSON:", e);
              // Fallback to empty array
              parsedPropertyRows = [];
            }
          }
        }
        // If already an object/array, use directly
        else if (typeof propertyRows === "object") {
          parsedPropertyRows = Array.isArray(propertyRows) ? propertyRows : [propertyRows];
        }
      } catch (error) {
        console.error("Error parsing propertyRows:", error);
      }
    }

    // Update property rows if we have valid data
    if (Array.isArray(parsedPropertyRows) && parsedPropertyRows.length > 0 && parsedPropertyRows.some((row) => row && row.rowId)) {
      await managePropertyRowsDisplayOrder(residency.id, parsedPropertyRows);
    }
    // For backward compatibility - ONLY IF NO VALID PROPERTY ROWS
    else if (residency && (featured === "Featured" || featured === "Yes")) {
      const featPos = featuredPosition !== undefined ? (Array.isArray(featuredPosition) ? parseInt(featuredPosition[0], 10) : parseInt(featuredPosition, 10)) : undefined;

      await manageFeaturedDisplayOrder(residency.id, true, featPos);
    }

    res.status(201).json({
      message: "Property added successfully",
      residency,
    });
  } catch (err) {
    console.error("Error creating residency:", err);
    res.status(500).json({
      message: `Failed to create property: ${err.message}`,
      error: err.message,
    });
  }
});

// Get PropertyRows with optional filtering
export const getPropertyRows = asyncHandler(async (req, res) => {
  try {
    const { rowType, rowId } = req.query;

    // Filter by row type or specific row ID
    let whereClause = {};
    if (rowType) {
      whereClause.rowType = rowType;
    }
    if (rowId) {
      whereClause.id = rowId;
    }

    const propertyRows = await prisma.propertyRow.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    });

    // If requesting a specific row ID or featured rows, also include property details
    if ((rowType === "featured" || rowId) && propertyRows.length > 0) {
      const targetRow = rowId ? propertyRows.find((row) => row.id === rowId) : propertyRows[0];

      if (targetRow && targetRow.displayOrder && targetRow.displayOrder.length > 0) {
        // Get property details for all IDs in the display order
        const propertyDetails = await Promise.all(
          targetRow.displayOrder.map(async (propertyId) => {
            try {
              const property = await prisma.residency.findUnique({
                where: { id: propertyId },
                select: {
                  id: true,
                  title: true,
                  streetAddress: true,
                  city: true,
                  state: true,
                  askingPrice: true,
                  imageUrls: true,
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
          ...targetRow,
          propertyDetails,
        });
      }
    }

    res.status(200).json(propertyRows);
  } catch (error) {
    console.error("Error fetching property rows:", error);
    res.status(500).json({ message: "Error fetching property rows", error: error.message });
  }
});

/**
 * Get CMA document for a specific property
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCmaDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Find the property
    const residency = await prisma.residency.findUnique({
      where: { id },
      select: { hasCma: true, cmaFilePath: true },
    });

    // Check if property exists and has a CMA document
    if (!residency) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!residency.hasCma || !residency.cmaFilePath) {
      return res.status(404).json({ message: "No CMA document found for this property" });
    }

    // Construct the file path
    const filePath = path.join(__dirname, "../", residency.cmaFilePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "CMA document file not found" });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error fetching CMA document:", error);
    res.status(500).json({
      message: "Failed to retrieve CMA document",
      error: error.message,
    });
  }
});
