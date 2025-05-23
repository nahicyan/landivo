import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

// Get all email lists
export const getAllEmailLists = asyncHandler(async (req, res) => {
  try {
    const lists = await prisma.emailList.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    // For each list, count the buyers that match its criteria
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        // Count buyers that are explicitly added to the list
        const manualCount = list.buyerIds.length;

        // Count buyers that match criteria (if criteria exists)
        let criteriaCount = 0;
        if (list.criteria) {
          const criteria = JSON.parse(JSON.stringify(list.criteria));

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

          // Count buyers matching the criteria
          criteriaCount = await prisma.buyer.count({
            where: query
          });
        }

        // Calculate total unique buyers
        // In a real implementation, you'd need to remove duplicates between manual and criteria
        const totalCount = manualCount + criteriaCount;

        return {
          ...list,
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
    // Get the list with related buyers
    const list = await prisma.emailList.findUnique({
      where: { id },
      include: {
        buyerMemberships: {
          include: {
            buyer: true
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get buyers matching criteria
    let criteriaBuyers = [];
    if (list.criteria) {
      const criteria = JSON.parse(JSON.stringify(list.criteria));

      // Build the query based on criteria
      const query = {};

      if (criteria.areas && criteria.areas.length > 0) {
        query.preferredAreas = {
          hasSome: criteria.areas
        };
      }

      if (criteria.buyerTypes && criteria.buyerTypes.length > 0) {
        query.buyerType = {
          in: criteria.buyerTypes
        };
      }

      if (criteria.isVIP) {
        query.source = "VIP Buyers List";
      }

      criteriaBuyers = await prisma.buyer.findMany({
        where: query
      });
    }

    // Combine manual and criteria buyers
    const allBuyerIds = new Set([
      ...list.buyers.map(b => b.id),
      ...criteriaBuyers.map(b => b.id)
    ]);

    const allBuyers = await prisma.buyer.findMany({
      where: {
        id: { in: Array.from(allBuyerIds) }
      },
      include: {
        emailLists: true
      }
    });

    res.status(200).json({
      ...list,
      buyers: allBuyers,
      buyerCount: allBuyers.length
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
  const { name, description, criteria, buyerIds = [], color } = req.body;

  if (!name) {
    return res.status(400).json({ message: "List name is required" });
  }

  try {
    // Create the list
    const newList = await prisma.emailList.create({
      data: {
        name,
        description,
        criteria,
        buyerIds,
        color,
        createdBy: req.userId // Assuming you have middleware that sets req.userId
      }
    });

    res.status(201).json({
      message: "Buyer list created successfully",
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
      return res.status(404).json({ message: "Buyer list not found" });
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
      message: "Buyer list updated successfully",
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

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  try {
    // Check if the list exists
    const existingList = await prisma.emailList.findUnique({
      where: { id }
    });

    if (!existingList) {
      return res.status(404).json({ message: "Buyer list not found" });
    }

    // Delete the list
    await prisma.emailList.delete({
      where: { id }
    });

    res.status(200).json({
      message: "Buyer list deleted successfully"
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

    // Update using relations
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        buyerMemberships: {
          create: buyerIds.map(buyerId => ({
            buyer: { connect: { id: buyerId } }
          }))
        },
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
      message: `Successfully added ${buyerIds.length} buyers to the list`,
      list: updatedList
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
      return res.status(404).json({ message: "Buyer list not found" });
    }

    // Get current buyer IDs
    const currentBuyerIds = existingList.buyerIds || [];

    // Remove specified buyer IDs
    const updatedBuyerIds = currentBuyerIds.filter(id => !buyerIds.includes(id));

    // Update the list
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        buyerIds: updatedBuyerIds,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      message: `Successfully removed ${buyerIds.length} buyers from the list`,
      list: updatedList
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
    // Get system settings for SMTP
    const settings = await prisma.settings.findFirst();

    if (!settings || !settings.smtpServer || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword) {
      return res.status(400).json({ message: "SMTP configuration not found. Please configure email settings." });
    }

    // Get the list with its buyers through relation
    const list = await prisma.emailList.findUnique({
      where: { id },
      include: {
        buyers: {
          where: {
            ...(includeUnsubscribed ? {} : {
              OR: [
                { emailStatus: null },
                { emailStatus: "available" }
              ]
            })
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get buyers matching criteria if any
    let criteriaBuyers = [];
    if (list.criteria) {
      const criteria = JSON.parse(JSON.stringify(list.criteria));

      const query = {
        ...(includeUnsubscribed ? {} : {
          OR: [
            { emailStatus: null },
            { emailStatus: "available" }
          ]
        })
      };

      if (criteria.areas && criteria.areas.length > 0) {
        query.preferredAreas = {
          hasSome: criteria.areas
        };
      }

      if (criteria.buyerTypes && criteria.buyerTypes.length > 0) {
        query.buyerType = {
          in: criteria.buyerTypes
        };
      }

      if (criteria.isVIP) {
        query.source = "VIP Buyers List";
      }

      criteriaBuyers = await prisma.buyer.findMany({
        where: query
      });
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([
      ...list.buyers.map(b => b.id),
      ...criteriaBuyers.map(b => b.id)
    ]);

    const allBuyers = await prisma.buyer.findMany({
      where: {
        id: { in: Array.from(allBuyerIds) }
      }
    });

    if (allBuyers.length === 0) {
      return res.status(404).json({
        message: "No eligible buyers found in this list"
      });
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpServer,
      port: parseInt(settings.smtpPort),
      secure: parseInt(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword
      }
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
    } catch (error) {
      console.error("SMTP verification failed:", error);
      return res.status(500).json({
        message: "Failed to connect to email server. Please check SMTP settings."
      });
    }

    // Send emails
    const emailResults = [];
    const failedEmails = [];

    for (const buyer of allBuyers) {
      // Personalize content
      const personalizedSubject = subject
        .replace(/{firstName}/g, buyer.firstName || '')
        .replace(/{lastName}/g, buyer.lastName || '')
        .replace(/{email}/g, buyer.email);

      const personalizedContent = content
        .replace(/{firstName}/g, buyer.firstName || '')
        .replace(/{lastName}/g, buyer.lastName || '')
        .replace(/{email}/g, buyer.email)
        .replace(/{preferredAreas}/g, (buyer.preferredAreas || []).join(", "));

      // Add unsubscribe link
      const htmlContent = `
        ${personalizedContent}
        <hr style="margin-top: 40px; border: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          You're receiving this email because you're subscribed to ${list.name}.
          <br>
          To unsubscribe, please contact us.
        </p>
      `;

      try {
        await transporter.sendMail({
          from: `"${list.name}" <${settings.smtpUser}>`,
          to: buyer.email,
          subject: personalizedSubject,
          html: htmlContent,
        });

        emailResults.push({
          buyerId: buyer.id,
          email: buyer.email,
          name: `${buyer.firstName} ${buyer.lastName}`,
          status: "sent"
        });
      } catch (error) {
        console.error(`Failed to send email to ${buyer.email}:`, error);
        failedEmails.push({
          buyerId: buyer.id,
          email: buyer.email,
          name: `${buyer.firstName} ${buyer.lastName}`,
          status: "failed",
          error: error.message
        });
      }
    }

    // Update last email date for the list
    await prisma.emailList.update({
      where: { id },
      data: {
        lastEmailDate: new Date()
      }
    });

    res.status(200).json({
      message: `Emails sent to ${emailResults.length} buyers${failedEmails.length > 0 ? `, ${failedEmails.length} failed` : ''}`,
      sent: emailResults,
      failed: failedEmails,
      totalRecipients: allBuyers.length
    });
  } catch (err) {
    console.error("Error sending email to list:", err);
    res.status(500).json({
      message: "An error occurred while sending email to the list",
      error: err.message
    });
  }
});