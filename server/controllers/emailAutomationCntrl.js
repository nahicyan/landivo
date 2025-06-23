// server/controllers/emailAutomationCntrl.js
import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { queueBulkEmails } from "../services/emailQueue.js";
import { sendSingleEmail } from "../services/emailService.js";

/**
 * Create a new automation rule
 * @route POST /api/email-automation
 * @access Private
 */
export const createAutomationRule = asyncHandler(async (req, res) => {
  const { 
    name, 
    description,
    triggerType, 
    conditions, 
    templateId, 
    targetLists, 
    delay = 0,
    delayUnit = 'minutes',
    isActive = true
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Validate required fields
    if (!name || !triggerType || !templateId) {
      return res.status(400).json({
        message: "Name, trigger type, and template are required"
      });
    }

    // Verify template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({
        message: "Email template not found"
      });
    }

    // Create automation rule
    const automationRule = await prisma.emailAutomationRule.create({
      data: {
        name,
        description,
        triggerType,
        triggerConditions: conditions || {},
        templateId,
        targetLists: targetLists || [],
        delay,
        delayUnit,
        isActive,
        userId
      },
      include: {
        template: {
          select: {
            name: true,
            category: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Automation rule created successfully",
      automationRule
    });
  } catch (error) {
    console.error("Error creating automation rule:", error);
    res.status(500).json({
      message: "Failed to create automation rule",
      error: error.message
    });
  }
});

/**
 * Get all automation rules
 * @route GET /api/email-automation
 * @access Private
 */
export const getAllAutomationRules = asyncHandler(async (req, res) => {
  const { isActive, triggerType, page = 1, limit = 20, search } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      userId: req.user.id,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(triggerType && { triggerType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [automationRules, total] = await Promise.all([
      prisma.emailAutomationRule.findMany({
        where,
        include: {
          template: {
            select: {
              name: true,
              category: true
            }
          },
          _count: {
            select: {
              executionHistory: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.emailAutomationRule.count({ where })
    ]);

    // Get execution counts for each rule
    const rulesWithStats = await Promise.all(
      automationRules.map(async (rule) => {
        const recentExecutions = await prisma.automationExecution.count({
          where: {
            ruleId: rule.id,
            executedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        });

        const lastExecution = await prisma.automationExecution.findFirst({
          where: { ruleId: rule.id },
          orderBy: { executedAt: 'desc' }
        });

        return {
          ...rule,
          recentExecutions,
          lastExecuted: lastExecution?.executedAt || null,
          totalRecipients: lastExecution?.recipientCount || 0
        };
      })
    );

    res.status(200).json({
      automationRules: rulesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching automation rules:", error);
    res.status(500).json({
      message: "Failed to fetch automation rules",
      error: error.message
    });
  }
});

/**
 * Get automation rule by ID
 * @route GET /api/email-automation/:id
 * @access Private
 */
export const getAutomationRuleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const automationRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        template: true,
        executionHistory: {
          orderBy: { executedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!automationRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    res.status(200).json({ automationRule });
  } catch (error) {
    console.error("Error fetching automation rule:", error);
    res.status(500).json({
      message: "Failed to fetch automation rule",
      error: error.message
    });
  }
});

/**
 * Update automation rule
 * @route PUT /api/email-automation/:id
 * @access Private
 */
export const updateAutomationRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description,
    triggerType, 
    conditions, 
    templateId, 
    targetLists, 
    delay,
    delayUnit,
    isActive 
  } = req.body;

  try {
    // Check if automation rule exists and belongs to user
    const existingRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!existingRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(triggerType && { triggerType }),
      ...(conditions && { triggerConditions: conditions }),
      ...(templateId && { templateId }),
      ...(targetLists && { targetLists }),
      ...(delay !== undefined && { delay }),
      ...(delayUnit && { delayUnit }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    };

    const automationRule = await prisma.emailAutomationRule.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            name: true,
            category: true
          }
        }
      }
    });

    res.status(200).json({
      message: "Automation rule updated successfully",
      automationRule
    });
  } catch (error) {
    console.error("Error updating automation rule:", error);
    res.status(500).json({
      message: "Failed to update automation rule",
      error: error.message
    });
  }
});

/**
 * Delete automation rule
 * @route DELETE /api/email-automation/:id
 * @access Private
 */
export const deleteAutomationRule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const automationRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!automationRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    // Delete execution history first
    await prisma.automationExecution.deleteMany({
      where: { ruleId: id }
    });

    // Delete automation rule
    await prisma.emailAutomationRule.delete({
      where: { id }
    });

    res.status(200).json({
      message: "Automation rule deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting automation rule:", error);
    res.status(500).json({
      message: "Failed to delete automation rule",
      error: error.message
    });
  }
});

/**
 * Toggle automation rule active/inactive
 * @route POST /api/email-automation/:id/toggle
 * @access Private
 */
export const toggleAutomationRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const automationRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!automationRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    const updatedRule = await prisma.emailAutomationRule.update({
      where: { id },
      data: { 
        isActive: isActive !== undefined ? isActive : !automationRule.isActive 
      }
    });

    res.status(200).json({
      message: `Automation rule ${updatedRule.isActive ? 'activated' : 'deactivated'} successfully`,
      automationRule: updatedRule
    });
  } catch (error) {
    console.error("Error toggling automation rule:", error);
    res.status(500).json({
      message: "Failed to toggle automation rule",
      error: error.message
    });
  }
});

/**
 * Get automation rule execution history
 * @route GET /api/email-automation/:id/history
 * @access Private
 */
export const getAutomationRuleHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const automationRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!automationRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [executions, total] = await Promise.all([
      prisma.automationExecution.findMany({
        where: { ruleId: id },
        orderBy: { executedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.automationExecution.count({
        where: { ruleId: id }
      })
    ]);

    res.status(200).json({
      executions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching automation rule history:", error);
    res.status(500).json({
      message: "Failed to fetch automation rule history",
      error: error.message
    });
  }
});

/**
 * Manually trigger automation rule
 * @route POST /api/email-automation/:id/trigger
 * @access Private
 */
export const triggerAutomationRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { triggerData = {} } = req.body;

  try {
    const automationRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        template: true
      }
    });

    if (!automationRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    if (!automationRule.isActive) {
      return res.status(400).json({
        message: "Cannot trigger inactive automation rule"
      });
    }

    // Execute the automation rule
    const result = await executeAutomationRule(automationRule, triggerData);

    res.status(200).json({
      message: "Automation rule triggered successfully",
      execution: result
    });
  } catch (error) {
    console.error("Error triggering automation rule:", error);
    res.status(500).json({
      message: "Failed to trigger automation rule",
      error: error.message
    });
  }
});

/**
 * Test automation rule with sample data
 * @route POST /api/email-automation/:id/test
 * @access Private
 */
export const testAutomationRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { testEmail, testData = {} } = req.body;

  try {
    if (!testEmail) {
      return res.status(400).json({
        message: "Test email address is required"
      });
    }

    const automationRule = await prisma.emailAutomationRule.findUnique({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        template: true
      }
    });

    if (!automationRule) {
      return res.status(404).json({
        message: "Automation rule not found"
      });
    }

    // Create test buyer object
    const testBuyer = {
      id: 'test',
      firstName: testData.firstName || 'Test',
      lastName: testData.lastName || 'User',
      email: testEmail,
      buyerType: testData.buyerType || 'Investor',
      ...testData
    };

    // Send test email
    await sendSingleEmail(
      testBuyer,
      automationRule.template.htmlContent,
      automationRule.template.subject,
      {
        fromName: "Landivo Test",
        fromEmail: process.env.SMTP_FROM_EMAIL
      }
    );

    res.status(200).json({
      message: "Test email sent successfully"
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      message: "Failed to send test email",
      error: error.message
    });
  }
});

/**
 * Execute automation rule
 * @param {Object} rule - Automation rule object
 * @param {Object} triggerData - Data that triggered the rule
 */
export const executeAutomationRule = async (rule, triggerData) => {
  try {
    console.log(`Executing automation rule: ${rule.name}`);

    // Get target buyers based on rule configuration
    const buyers = await getTargetBuyers(rule, triggerData);

    if (buyers.length === 0) {
      console.log(`No target buyers found for rule: ${rule.name}`);
      return await recordExecution(rule.id, triggerData, 0, 'completed');
    }

    // Apply delay if specified
    if (rule.delay > 0) {
      const delayMs = calculateDelayInMs(rule.delay, rule.delayUnit);
      console.log(`Delaying execution of rule ${rule.name} by ${rule.delay} ${rule.delayUnit}`);
      
      // Queue for later execution
      setTimeout(async () => {
        await queueBulkEmails(buyers, rule.templateId, {
          fromName: "Landivo",
          fromEmail: process.env.SMTP_FROM_EMAIL
        });
      }, delayMs);
    } else {
      // Execute immediately
      await queueBulkEmails(buyers, rule.templateId, {
        fromName: "Landivo",
        fromEmail: process.env.SMTP_FROM_EMAIL
      });
    }

    // Record execution
    return await recordExecution(rule.id, triggerData, buyers.length, 'queued');

  } catch (error) {
    console.error(`Error executing automation rule ${rule.name}:`, error);
    return await recordExecution(rule.id, triggerData, 0, 'failed');
  }
};

/**
 * Get target buyers for automation rule
 * @param {Object} rule - Automation rule
 * @param {Object} triggerData - Trigger data
 */
async function getTargetBuyers(rule, triggerData) {
  const buyers = new Set();

  // Get buyers from target lists
  if (rule.targetLists && rule.targetLists.length > 0) {
    for (const listId of rule.targetLists) {
      try {
        const listBuyers = await getBuyersFromList(listId);
        listBuyers.forEach(buyer => buyers.add(buyer));
      } catch (error) {
        console.error(`Error getting buyers from list ${listId}:`, error);
      }
    }
  }

  // Apply trigger-specific filters
  const filteredBuyers = Array.from(buyers).filter(buyer => 
    matchesTriggerConditions(buyer, rule.triggerType, rule.triggerConditions, triggerData)
  );

  return filteredBuyers;
}

/**
 * Get buyers from email list
 * @param {string} listId - Email list ID
 */
async function getBuyersFromList(listId) {
  const emailList = await prisma.emailList.findUnique({
    where: { id: listId },
    include: {
      buyerMemberships: {
        include: {
          buyer: {
            where: {
              emailOptIn: true,
              emailStatus: {
                not: 'unsubscribed'
              }
            }
          }
        }
      }
    }
  });

  if (!emailList) {
    return [];
  }

  const buyers = emailList.buyerMemberships
    .map(membership => membership.buyer)
    .filter(buyer => buyer !== null);

  // Add buyers matching criteria if defined
  if (emailList.criteria) {
    const criteriaBuyers = await getBuyersMatchingCriteria(emailList.criteria);
    criteriaBuyers.forEach(buyer => {
      if (!buyers.find(b => b.id === buyer.id)) {
        buyers.push(buyer);
      }
    });
  }

  return buyers;
}

/**
 * Get buyers matching criteria
 * @param {Object} criteria - Search criteria
 */
async function getBuyersMatchingCriteria(criteria) {
  const query = {
    emailOptIn: true,
    emailStatus: {
      not: 'unsubscribed'
    }
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

  return await prisma.buyer.findMany({
    where: query,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      buyerType: true,
      preferredAreas: true
    }
  });
}

/**
 * Check if buyer matches trigger conditions
 * @param {Object} buyer - Buyer object
 * @param {string} triggerType - Trigger type
 * @param {Object} conditions - Trigger conditions
 * @param {Object} triggerData - Trigger data
 */
function matchesTriggerConditions(buyer, triggerType, conditions, triggerData) {
  // Basic email opt-in check
  if (!buyer.emailOptIn || buyer.emailStatus === 'unsubscribed') {
    return false;
  }

  // Trigger-specific matching logic
  switch (triggerType) {
    case 'buyer_registered':
      return true; // All new buyers get welcome email
      
    case 'property_uploaded':
      // Check if buyer is interested in this property type/area
      if (conditions.propertyTypes && triggerData.propertyType) {
        if (!conditions.propertyTypes.includes(triggerData.propertyType)) {
          return false;
        }
      }
      
      if (conditions.areas && triggerData.area && buyer.preferredAreas) {
        if (!buyer.preferredAreas.includes(triggerData.area)) {
          return false;
        }
      }
      
      if (conditions.priceRange && triggerData.price) {
        const { min, max } = conditions.priceRange;
        if (triggerData.price < min || triggerData.price > max) {
          return false;
        }
      }
      
      return true;
      
    case 'property_price_drop':
      // Check minimum reduction amount
      if (conditions.minimumReduction && triggerData.reduction) {
        return triggerData.reduction >= conditions.minimumReduction;
      }
      return true;
      
    case 'buyer_inactive':
      // This would be handled by a scheduled job
      return true;
      
    default:
      return true;
  }
}

/**
 * Record automation execution
 * @param {string} ruleId - Rule ID
 * @param {Object} triggerData - Trigger data
 * @param {number} recipientCount - Number of recipients
 * @param {string} status - Execution status
 */
async function recordExecution(ruleId, triggerData, recipientCount, status) {
  return await prisma.automationExecution.create({
    data: {
      ruleId,
      triggeredBy: triggerData,
      recipientCount,
      status,
      executedAt: new Date()
    }
  });
}

/**
 * Calculate delay in milliseconds
 * @param {number} delay - Delay amount
 * @param {string} unit - Delay unit (minutes, hours, days)
 */
function calculateDelayInMs(delay, unit) {
  switch (unit) {
    case 'minutes':
      return delay * 60 * 1000;
    case 'hours':
      return delay * 60 * 60 * 1000;
    case 'days':
      return delay * 24 * 60 * 60 * 1000;
    default:
      return delay * 60 * 1000; // Default to minutes
  }
}