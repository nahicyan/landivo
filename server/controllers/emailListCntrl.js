import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

// Get all email lists
export const getAllEmailLists = asyncHandler(async (req, res) => {
  try {
    const lists = await prisma.emailList.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        buyerMemberships: {
          select: {
            buyerId: true
          }
        }
      }
    });

    // For each list, count the buyers that match its criteria and manual members
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        // Get manually added buyers through join table
        const manualBuyerIds = list.buyerMemberships.map(m => m.buyerId);

        // Get buyers that match criteria
        let criteriaBuyerIds = [];
        if (list.criteria) {
          const criteria = JSON.parse(JSON.stringify(list.criteria));

          // Check if criteria has any actual filters
          const hasCriteriaFilters = 
            (criteria.areas && criteria.areas.length > 0) ||
            (criteria.buyerTypes && criteria.buyerTypes.length > 0) ||
            criteria.isVIP;

          if (hasCriteriaFilters) {
            // Build the query based on criteria
            const query = {};

            // Add area filter if specified
            if (criteria.areas && criteria.areas.length > 0) {
              query.preferredAreas = {
                hasSome: criteria.areas
              };
            }

            // Add buyer type filter if specified
            if (criteria.buyerTypes && criteria.buyerTypes.length > 0) {
              query.buyerType = {
                in: criteria.buyerTypes
              };
            }

            // Add VIP filter if specified
            if (criteria.isVIP) {
              query.source = "VIP Buyers List";
            }

            // Get buyer IDs matching the criteria
            const criteriaBuyers = await prisma.buyer.findMany({
              where: query,
              select: { id: true }
            });

            criteriaBuyerIds = criteriaBuyers.map(b => b.id);
          }
        }

        // Combine and remove duplicates using Set
        const uniqueBuyerIds = new Set([...manualBuyerIds, ...criteriaBuyerIds]);
        const totalCount = uniqueBuyerIds.size;

        // Remove the buyerMemberships from the response
        const { buyerMemberships, ...listData } = list;

        return {
          ...listData,
          buyerCount: totalCount
        };
      })
    );

    res.status(200).json(listsWithCounts);
  } catch (err) {
    console.error("Error fetching email lists:", err);
    res.status(500).json({
      message: "An error occurred while fetching email lists",
      error: err.message
    });
  }
});

// Get a specific email list with its members
export const getEmailList = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  try {
    // Get the list with buyers through join table
    const list = await prisma.emailList.findUnique({
      where: { id },
      include: {
        buyerMemberships: {
          include: {
            buyer: {
              include: {
                emailListMemberships: {
                  include: {
                    emailList: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Extract buyers from join table
    const manualBuyers = list.buyerMemberships.map(membership => membership.buyer);

    // Get buyers matching criteria
    let criteriaBuyers = [];
    if (list.criteria) {
      const criteria = JSON.parse(JSON.stringify(list.criteria));

      // Check if criteria has any actual filters
      const hasCriteriaFilters = 
        (criteria.areas && criteria.areas.length > 0) ||
        (criteria.buyerTypes && criteria.buyerTypes.length > 0) ||
        criteria.isVIP;

      if (hasCriteriaFilters) {
        // Build the query based on criteria
        const query = {};

        // Add area filter if specified
        if (criteria.areas && criteria.areas.length > 0) {
          query.preferredAreas = {
            hasSome: criteria.areas
          };
        }

        // Add buyer type filter if specified
        if (criteria.buyerTypes && criteria.buyerTypes.length > 0) {
          query.buyerType = {
            in: criteria.buyerTypes
          };
        }

        // Add VIP filter if specified
        if (criteria.isVIP) {
          query.source = "VIP Buyers List";
        }

        // Get buyers matching the criteria
        criteriaBuyers = await prisma.buyer.findMany({
          where: query,
          include: {
            emailListMemberships: {
              include: {
                emailList: true
              }
            }
          }
        });
      }
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([
      ...manualBuyers.map(b => b.id),
      ...criteriaBuyers.map(b => b.id)
    ]);

    const allBuyers = await prisma.buyer.findMany({
      where: {
        id: { in: Array.from(allBuyerIds) }
      },
      include: {
        emailListMemberships: {
          include: {
            emailList: true
          }
        }
      }
    });

    // Transform buyer data to include emailLists array
    const buyersWithEmailLists = allBuyers.map(buyer => {
      const { emailListMemberships, ...buyerData } = buyer;
      return {
        ...buyerData,
        emailLists: emailListMemberships.map(m => m.emailList)
      };
    });

    // Remove buyerMemberships from response and add transformed buyers
    const { buyerMemberships, ...listData } = list;

    res.status(200).json({
      ...listData,
      buyers: buyersWithEmailLists,
      buyerCount: buyersWithEmailLists.length
    });
  } catch (err) {
    console.error("Error fetching email list:", err);
    res.status(500).json({
      message: "An error occurred while fetching the email list",
      error: err.message
    });
  }
});

// Create a new email list
export const createEmailList = asyncHandler(async (req, res) => {
  const { name, description, criteria, buyerIds = [], color, source } = req.body;

  if (!name) {
    return res.status(400).json({ message: "List name is required" });
  }

  try {
    // Ensure buyerIds is an array
    const buyerIdsArray = Array.isArray(buyerIds) ? buyerIds : [];

    // Create the list with initial buyers if provided
    const newList = await prisma.emailList.create({
      data: {
        name,
        description,
        criteria,
        color,
        source: source || "Manual", // Add source field with default fallback
        createdBy: req.userId,
        buyerMemberships: {
          create: buyerIdsArray.map(buyerId => ({
            buyer: { connect: { id: buyerId } }
          }))
        }
      }
    });

    res.status(201).json({
      message: "Email list created successfully",
      list: newList
    });
  } catch (err) {
    console.error("Error creating email list:", err);
    res.status(500).json({
      message: "An error occurred while creating the email list",
      error: err.message
    });
  }
});

// Update a email list
export const updateEmailList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, criteria, color } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!name) {
    return res.status(400).json({ message: "List name is required" });
  }

  try {
    // Check if the list exists
    const existingList = await prisma.emailList.findUnique({
      where: { id }
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Update the list
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        name,
        description,
        criteria,
        color,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      message: "Email list updated successfully",
      list: updatedList
    });
  } catch (err) {
    console.error("Error updating email list:", err);
    res.status(500).json({
      message: "An error occurred while updating the email list",
      error: err.message
    });
  }
});

// Delete a email list
export const deleteEmailList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deleteBuyers = false } = req.body; // New parameter

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  try {
    // Check if the list exists
    const existingList = await prisma.emailList.findUnique({
      where: { id }
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    let deletedBuyersCount = 0;

    if (deleteBuyers) {
      // Get all buyer IDs in this list
      const buyerMemberships = await prisma.buyerEmailList.findMany({
        where: { emailListId: id },
        select: { buyerId: true }
      });
      
      const buyerIds = buyerMemberships.map(m => m.buyerId);
      
      if (buyerIds.length > 0) {
        // Delete offers first (foreign key constraint)
        await prisma.offer.deleteMany({
          where: { buyerId: { in: buyerIds } }
        });
        
        // Delete buyer activities
        await prisma.buyerActivity.deleteMany({
          where: { buyerId: { in: buyerIds } }
        });
        
        // Delete all buyer memberships for these buyers
        await prisma.buyerEmailList.deleteMany({
          where: { buyerId: { in: buyerIds } }
        });
        
        // Delete the buyers
        const deleteResult = await prisma.buyer.deleteMany({
          where: { id: { in: buyerIds } }
        });
        
        deletedBuyersCount = deleteResult.count;
      }
    } else {
      // Just delete the memberships for this list
      await prisma.buyerEmailList.deleteMany({
        where: { emailListId: id }
      });
    }

    // Delete the list
    await prisma.emailList.delete({
      where: { id }
    });

    res.status(200).json({
      message: deleteBuyers 
        ? `Email list and ${deletedBuyersCount} buyers deleted successfully`
        : "Email list deleted successfully",
      deletedBuyersCount
    });
  } catch (err) {
    console.error("Error deleting email list:", err);
    res.status(500).json({
      message: "An error occurred while deleting the email list",
      error: err.message
    });
  }
});

// Add buyers to a list
export const addBuyersToList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { buyerIds } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "At least one buyer ID is required" });
  }

  try {
    // Check if the list exists
    const existingList = await prisma.emailList.findUnique({
      where: { id }
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get existing memberships to avoid duplicates
    const existingMemberships = await prisma.buyerEmailList.findMany({
      where: {
        emailListId: id,
        buyerId: { in: buyerIds }
      },
      select: { buyerId: true }
    });

    const existingBuyerIds = new Set(existingMemberships.map(m => m.buyerId));
    const newBuyerIds = buyerIds.filter(buyerId => !existingBuyerIds.has(buyerId));

    // Create new memberships for buyers not already in the list
    if (newBuyerIds.length > 0) {
      await prisma.buyerEmailList.createMany({
        data: newBuyerIds.map(buyerId => ({
          buyerId,
          emailListId: id
        }))
      });
    }

    // Update the list's updatedAt timestamp
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        updatedAt: new Date()
      },
      include: {
        buyerMemberships: {
          include: {
            buyer: true
          }
        }
      }
    });

    res.status(200).json({
      message: `Successfully added ${newBuyerIds.length} new buyers to the list (${existingBuyerIds.size} were already in the list)`,
      list: updatedList,
      addedCount: newBuyerIds.length,
      skippedCount: existingBuyerIds.size
    });
  } catch (err) {
    console.error("Error adding buyers to list:", err);
    res.status(500).json({
      message: "An error occurred while adding buyers to the list",
      error: err.message
    });
  }
});

// Remove buyers from a list
export const removeBuyersFromList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { buyerIds } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "At least one buyer ID is required" });
  }

  try {
    // Check if the list exists
    const existingList = await prisma.emailList.findUnique({
      where: { id }
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Delete memberships
    const deleteResult = await prisma.buyerEmailList.deleteMany({
      where: {
        emailListId: id,
        buyerId: { in: buyerIds }
      }
    });

    // Update the list
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      message: `Successfully removed ${deleteResult.count} buyers from the list`,
      list: updatedList,
      removedCount: deleteResult.count
    });
  } catch (err) {
    console.error("Error removing buyers from list:", err);
    res.status(500).json({
      message: "An error occurred while removing buyers from the list",
      error: err.message
    });
  }
});

// Send email to list members
export const sendEmailToList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, content, includeUnsubscribed = false } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!subject || !content) {
    return res.status(400).json({ message: "Email subject and content are required" });
  }

  try {
    // Get the list
    const list = await prisma.emailList.findUnique({
      where: { id }
    });

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get manually added buyers through join table
    const manualBuyerMemberships = await prisma.buyerEmailList.findMany({
      where: {
        emailListId: id
      },
      include: {
        buyer: true
      }
    });

    const manualBuyers = manualBuyerMemberships.map(m => m.buyer);

    // Get buyers matching criteria
    let criteriaBuyers = [];
    if (list.criteria) {
      const criteria = JSON.parse(JSON.stringify(list.criteria));

      // Check if criteria has any actual filters
      const hasCriteriaFilters = 
        (criteria.areas && criteria.areas.length > 0) ||
        (criteria.buyerTypes && criteria.buyerTypes.length > 0) ||
        criteria.isVIP;

      if (hasCriteriaFilters) {
        // Build the query based on criteria
        const query = {
          ...(includeUnsubscribed ? {} : {
            OR: [
              { emailStatus: null },
              { emailStatus: "available" }
            ]
          })
        };

        // Add area filter if specified
        if (criteria.areas && criteria.areas.length > 0) {
          query.preferredAreas = {
            hasSome: criteria.areas
          };
        }

        // Add buyer type filter if specified
        if (criteria.buyerTypes && criteria.buyerTypes.length > 0) {
          query.buyerType = {
            in: criteria.buyerTypes
          };
        }

        // Add VIP filter if specified
        if (criteria.isVIP) {
          query.source = "VIP Buyers List";
        }

        // Get buyers matching the criteria
        criteriaBuyers = await prisma.buyer.findMany({
          where: query
        });
      }
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([
      ...manualBuyers.map(b => b.id),
      ...criteriaBuyers.map(b => b.id)
    ]);

    // Get all unique buyers with email status check
    const allBuyers = await prisma.buyer.findMany({
      where: {
        id: { in: Array.from(allBuyerIds) },
        ...(includeUnsubscribed ? {} : {
          OR: [
            { emailStatus: null },
            { emailStatus: "available" }
          ]
        })
      }
    });

    if (allBuyers.length === 0) {
      return res.status(404).json({
        message: "No eligible buyers found in this list"
      });
    }

    // In a real implementation, you'd use a service like SendGrid, Mailchimp, etc.
    // Here we'll simulate sending emails

    // Process email content with placeholders
    const emailsSent = allBuyers.map(buyer => {
      // Replace placeholders with buyer data
      const personalizedContent = content
        .replace(/{firstName}/g, buyer.firstName || '')
        .replace(/{lastName}/g, buyer.lastName || '')
        .replace(/{email}/g, buyer.email)
        .replace(/{preferredAreas}/g, (buyer.preferredAreas || []).join(", "));

      // In a real implementation, send the email here
      // await emailService.send({
      //   to: buyer.email,
      //   subject: subject,
      //   html: personalizedContent
      // });

      return {
        buyerId: buyer.id,
        email: buyer.email,
        name: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
        status: "sent" // In a real implementation, this would be the actual status
      };
    });

    // Update last email date for the list
    await prisma.emailList.update({
      where: { id },
      data: {
        lastEmailDate: new Date()
      }
    });

    res.status(200).json({
      message: `Successfully sent emails to ${emailsSent.length} buyers in the list`,
      emailsSent,
      totalRecipients: emailsSent.length
    });
  } catch (err) {
    console.error("Error sending email to list:", err);
    res.status(500).json({
      message: "An error occurred while sending email to the list",
      error: err.message
    });
  }
});