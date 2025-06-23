// server/controllers/emailTemplateCntrl.js
import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import Handlebars from "handlebars";

/**
 * Create a new email template
 * @route POST /api/email-templates
 * @access Private
 */
export const createTemplate = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    category, 
    subject, 
    htmlContent, 
    variables = [] 
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Validate required fields
    if (!name || !subject || !htmlContent) {
      return res.status(400).json({
        message: "Template name, subject, and HTML content are required"
      });
    }

    // Extract variables from content if not provided
    const extractedVariables = variables.length > 0 ? variables : extractVariablesFromContent(htmlContent);

    // Create template
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        description,
        category: category || "General",
        subject,
        htmlContent,
        variables: extractedVariables,
        userId,
        isActive: true
      }
    });

    res.status(201).json({
      message: "Template created successfully",
      template
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      message: "Failed to create template",
      error: error.message
    });
  }
});

/**
 * Get all email templates
 * @route GET /api/email-templates
 * @access Private
 */
export const getAllTemplates = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 20, search, isActive } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      OR: [
        { userId: req.user.id }, // User's templates
        { isSystemTemplate: true } // System templates
      ],
      ...(category && category !== 'all' && { category }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              campaigns: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.emailTemplate.count({ where })
    ]);

    res.status(200).json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      message: "Failed to fetch templates",
      error: error.message
    });
  }
});

/**
 * Get template by ID
 * @route GET /api/email-templates/:id
 * @access Private
 */
export const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { 
        id,
        OR: [
          { userId: req.user.id },
          { isSystemTemplate: true }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    res.status(200).json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({
      message: "Failed to fetch template",
      error: error.message
    });
  }
});

/**
 * Update template
 * @route PUT /api/email-templates/:id
 * @access Private
 */
export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, category, subject, htmlContent, variables, isActive } = req.body;

  try {
    // Check if template exists and belongs to user
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { 
        id,
        userId: req.user.id // Only allow updating user's own templates
      }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        message: "Template not found or you don't have permission to edit it"
      });
    }

    // Extract variables from content if HTML content is being updated
    const extractedVariables = htmlContent ? 
      (variables && variables.length > 0 ? variables : extractVariablesFromContent(htmlContent)) :
      existingTemplate.variables;

    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(subject && { subject }),
      ...(htmlContent && { htmlContent }),
      ...(extractedVariables && { variables: extractedVariables }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    };

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      message: "Template updated successfully",
      template
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      message: "Failed to update template",
      error: error.message
    });
  }
});

/**
 * Delete template
 * @route DELETE /api/email-templates/:id
 * @access Private
 */
export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { 
        id,
        userId: req.user.id
      },
      include: {
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found or you don't have permission to delete it"
      });
    }

    // Check if template is being used in campaigns
    if (template._count.campaigns > 0) {
      return res.status(400).json({
        message: "Cannot delete template that is being used in campaigns"
      });
    }

    await prisma.emailTemplate.delete({
      where: { id }
    });

    res.status(200).json({
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      message: "Failed to delete template",
      error: error.message
    });
  }
});

/**
 * Duplicate template
 * @route POST /api/email-templates/:id/duplicate
 * @access Private
 */
export const duplicateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const originalTemplate = await prisma.emailTemplate.findUnique({
      where: { 
        id,
        OR: [
          { userId: req.user.id },
          { isSystemTemplate: true }
        ]
      }
    });

    if (!originalTemplate) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    const duplicatedTemplate = await prisma.emailTemplate.create({
      data: {
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        subject: originalTemplate.subject,
        htmlContent: originalTemplate.htmlContent,
        variables: originalTemplate.variables,
        userId: req.user.id,
        isActive: true,
        isSystemTemplate: false
      }
    });

    res.status(201).json({
      message: "Template duplicated successfully",
      template: duplicatedTemplate
    });
  } catch (error) {
    console.error("Error duplicating template:", error);
    res.status(500).json({
      message: "Failed to duplicate template",
      error: error.message
    });
  }
});

/**
 * Preview template with sample data
 * @route POST /api/email-templates/:id/preview
 * @access Private
 */
export const previewTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sampleData = {} } = req.body;

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { 
        id,
        OR: [
          { userId: req.user.id },
          { isSystemTemplate: true }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    // Default sample data for buyers
    const defaultSampleData = {
      buyerName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      propertyTitle: "Beautiful 3BR House in Downtown",
      propertyPrice: "$350,000",
      propertyLocation: "Downtown District",
      propertyType: "House",
      propertyImage: "https://via.placeholder.com/400x300",
      propertyUrl: "https://landivo.com/properties/sample",
      eventDate: "Saturday, June 22, 2024",
      eventTime: "2:00 PM - 4:00 PM",
      propertyAddress: "123 Main Street, City, State 12345",
      rsvpUrl: "https://landivo.com/events/rsvp",
      originalPrice: "$370,000",
      newPrice: "$350,000",
      savingsAmount: "$20,000",
      month: "June",
      year: "2024",
      marketArea: "Downtown District",
      averagePrice: "$375,000",
      priceChange: "+2.5%",
      propertiesSold: "45",
      daysOnMarket: "18 days",
      marketInsights: "The market is showing strong activity with increased buyer interest.",
      fullReportUrl: "https://landivo.com/reports/market",
      profileUrl: "https://landivo.com/profile",
      browseUrl: "https://landivo.com/properties",
      ...sampleData
    };

    try {
      // Compile and render template with sample data
      const compiledTemplate = Handlebars.compile(template.htmlContent);
      const renderedHtml = compiledTemplate(defaultSampleData);

      // Also render subject
      const compiledSubject = Handlebars.compile(template.subject);
      const renderedSubject = compiledSubject(defaultSampleData);

      res.status(200).json({
        subject: renderedSubject,
        htmlContent: renderedHtml,
        variables: template.variables,
        sampleData: defaultSampleData
      });
    } catch (renderError) {
      console.error("Template rendering error:", renderError);
      res.status(400).json({
        message: "Template rendering failed",
        error: renderError.message,
        subject: template.subject,
        htmlContent: template.htmlContent
      });
    }
  } catch (error) {
    console.error("Error previewing template:", error);
    res.status(500).json({
      message: "Failed to preview template",
      error: error.message
    });
  }
});

/**
 * Get template categories
 * @route GET /api/email-templates/categories
 * @access Private
 */
export const getTemplateCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { isSystemTemplate: true }
        ]
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categoryList = categories.map(cat => cat.category).filter(Boolean);

    res.status(200).json({
      categories: categoryList
    });
  } catch (error) {
    console.error("Error fetching template categories:", error);
    res.status(500).json({
      message: "Failed to fetch template categories",
      error: error.message
    });
  }
});

/**
 * Get system templates
 * @route GET /api/email-templates/system
 * @access Private
 */
export const getSystemTemplates = asyncHandler(async (req, res) => {
  try {
    const systemTemplates = await prisma.emailTemplate.findMany({
      where: {
        isSystemTemplate: true,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subject: true,
        variables: true
      },
      orderBy: { category: 'asc' }
    });

    res.status(200).json({
      templates: systemTemplates
    });
  } catch (error) {
    console.error("Error fetching system templates:", error);
    res.status(500).json({
      message: "Failed to fetch system templates",
      error: error.message
    });
  }
});

/**
 * Helper function to extract variables from HTML content
 */
function extractVariablesFromContent(htmlContent) {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = variableRegex.exec(htmlContent)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}