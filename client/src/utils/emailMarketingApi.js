// client/src/utils/emailMarketingApi.js
import { api } from './api'; // Your existing API utility

// Email Campaigns API
export const emailCampaignApi = {
  // Get all campaigns
  getAllCampaigns: async (params = {}) => {
    const response = await api.get('/email-campaigns', { params });
    return response.data;
  },

  // Get campaign by ID
  getCampaignById: async (id) => {
    const response = await api.get(`/email-campaigns/${id}`);
    return response.data;
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    const response = await api.post('/email-campaigns', campaignData);
    return response.data;
  },

  // Update campaign
  updateCampaign: async (id, campaignData) => {
    const response = await api.put(`/email-campaigns/${id}`, campaignData);
    return response.data;
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    const response = await api.delete(`/email-campaigns/${id}`);
    return response.data;
  },

  // Send campaign
  sendCampaign: async (id) => {
    const response = await api.post(`/email-campaigns/${id}/send`);
    return response.data;
  },

  // Schedule campaign
  scheduleCampaign: async (id, scheduledAt) => {
    const response = await api.post(`/email-campaigns/${id}/schedule`, { scheduledAt });
    return response.data;
  },

  // Pause campaign
  pauseCampaign: async (id) => {
    const response = await api.post(`/email-campaigns/${id}/pause`);
    return response.data;
  },

  // Clone campaign
  cloneCampaign: async (id) => {
    const response = await api.post(`/email-campaigns/${id}/clone`);
    return response.data;
  },

  // Test campaign
  testCampaign: async (id, testEmail) => {
    const response = await api.post(`/email-campaigns/${id}/test`, { testEmail });
    return response.data;
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id) => {
    const response = await api.get(`/email-campaigns/${id}/analytics`);
    return response.data;
  },

  // Get campaign recipients
  getCampaignRecipients: async (id, params = {}) => {
    const response = await api.get(`/email-campaigns/${id}/recipients`, { params });
    return response.data;
  }
};

// Email Templates API
export const emailTemplateApi = {
  // Get all templates
  getAllTemplates: async (params = {}) => {
    const response = await api.get('/email-templates', { params });
    return response.data;
  },

  // Get template by ID
  getTemplateById: async (id) => {
    const response = await api.get(`/email-templates/${id}`);
    return response.data;
  },

  // Create new template
  createTemplate: async (templateData) => {
    const response = await api.post('/email-templates', templateData);
    return response.data;
  },

  // Update template
  updateTemplate: async (id, templateData) => {
    const response = await api.put(`/email-templates/${id}`, templateData);
    return response.data;
  },

  // Delete template
  deleteTemplate: async (id) => {
    const response = await api.delete(`/email-templates/${id}`);
    return response.data;
  },

  // Duplicate template
  duplicateTemplate: async (id) => {
    const response = await api.post(`/email-templates/${id}/duplicate`);
    return response.data;
  },

  // Preview template
  previewTemplate: async (id, sampleData = {}) => {
    const response = await api.post(`/email-templates/${id}/preview`, { sampleData });
    return response.data;
  },

  // Get template categories
  getTemplateCategories: async () => {
    const response = await api.get('/email-templates/categories');
    return response.data;
  },

  // Get system templates
  getSystemTemplates: async () => {
    const response = await api.get('/email-templates/system');
    return response.data;
  }
};

// Email Automation API
export const emailAutomationApi = {
  // Get all automation rules
  getAllAutomationRules: async (params = {}) => {
    const response = await api.get('/email-automation', { params });
    return response.data;
  },

  // Get automation rule by ID
  getAutomationRuleById: async (id) => {
    const response = await api.get(`/email-automation/${id}`);
    return response.data;
  },

  // Create new automation rule
  createAutomationRule: async (ruleData) => {
    const response = await api.post('/email-automation', ruleData);
    return response.data;
  },

  // Update automation rule
  updateAutomationRule: async (id, ruleData) => {
    const response = await api.put(`/email-automation/${id}`, ruleData);
    return response.data;
  },

  // Delete automation rule
  deleteAutomationRule: async (id) => {
    const response = await api.delete(`/email-automation/${id}`);
    return response.data;
  },

  // Toggle automation rule
  toggleAutomationRule: async (id, isActive) => {
    const response = await api.post(`/email-automation/${id}/toggle`, { isActive });
    return response.data;
  },

  // Trigger automation rule manually
  triggerAutomationRule: async (id, triggerData = {}) => {
    const response = await api.post(`/email-automation/${id}/trigger`, { triggerData });
    return response.data;
  },

  // Test automation rule
  testAutomationRule: async (id, testEmail, testData = {}) => {
    const response = await api.post(`/email-automation/${id}/test`, { testEmail, testData });
    return response.data;
  },

  // Get automation rule history
  getAutomationRuleHistory: async (id, params = {}) => {
    const response = await api.get(`/email-automation/${id}/history`, { params });
    return response.data;
  }
};

// Email Tracking API
export const emailTrackingApi = {
  // Get email analytics
  getEmailAnalytics: async (params = {}) => {
    const response = await api.get('/email-tracking/analytics', { params });
    return response.data;
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id) => {
    const response = await api.get(`/email-tracking/campaigns/${id}/analytics`);
    return response.data;
  },

  // Get buyer email history
  getBuyerEmailHistory: async (id, params = {}) => {
    const response = await api.get(`/email-tracking/buyers/${id}/history`, { params });
    return response.data;
  },

  // Unsubscribe buyer
  unsubscribeBuyer: async (email, token) => {
    const response = await api.post('/email-tracking/unsubscribe', { email, token });
    return response.data;
  }
};

// Email List API (extends existing email list functionality)
export const emailListApi = {
  // Get all email lists (assuming this exists)
  getAllEmailLists: async (params = {}) => {
    const response = await api.get('/email-lists', { params });
    return response.data;
  },

  // Create email list
  createEmailList: async (listData) => {
    const response = await api.post('/email-lists', listData);
    return response.data;
  },

  // Update email list
  updateEmailList: async (id, listData) => {
    const response = await api.put(`/email-lists/${id}`, listData);
    return response.data;
  },

  // Add buyers to list
  addBuyersToList: async (listId, buyerIds) => {
    const response = await api.post(`/email-lists/${listId}/buyers`, { buyerIds });
    return response.data;
  },

  // Remove buyers from list
  removeBuyersFromList: async (listId, buyerIds) => {
    const response = await api.delete(`/email-lists/${listId}/buyers`, { data: { buyerIds } });
    return response.data;
  },

  // Get list performance
  getListPerformance: async (listId) => {
    const response = await api.get(`/email-lists/${listId}/performance`);
    return response.data;
  }
};

// Utility functions
export const emailMarketingUtils = {
  // Format email metrics
  formatMetrics: (metrics) => {
    const {
      totalSent = 0,
      opens = 0,
      clicks = 0,
      bounces = 0,
      unsubscribes = 0
    } = metrics;

    return {
      totalSent: totalSent.toLocaleString(),
      opens: opens.toLocaleString(),
      clicks: clicks.toLocaleString(),
      bounces: bounces.toLocaleString(),
      unsubscribes: unsubscribes.toLocaleString(),
      openRate: totalSent > 0 ? ((opens / totalSent) * 100).toFixed(1) : '0.0',
      clickRate: totalSent > 0 ? ((clicks / totalSent) * 100).toFixed(1) : '0.0',
      bounceRate: totalSent > 0 ? ((bounces / totalSent) * 100).toFixed(1) : '0.0',
      unsubscribeRate: totalSent > 0 ? ((unsubscribes / totalSent) * 100).toFixed(1) : '0.0'
    };
  },

  // Get status color
  getStatusColor: (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      queued: 'bg-blue-100 text-blue-800',
      sending: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || statusColors.draft;
  },

  // Validate email template
  validateTemplate: (template) => {
    const errors = {};

    if (!template.name?.trim()) {
      errors.name = 'Template name is required';
    }

    if (!template.subject?.trim()) {
      errors.subject = 'Subject line is required';
    }

    if (!template.htmlContent?.trim()) {
      errors.htmlContent = 'HTML content is required';
    }

    // Check for unmatched handlebars variables
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(template.htmlContent || '')) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      variables
    };
  },

  // Generate sample data for template preview
  generateSampleData: () => ({
    buyerName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    buyerType: 'Investor',
    propertyTitle: 'Beautiful 3BR Downtown Condo',
    propertyPrice: '$450,000',
    propertyLocation: 'Downtown District',
    propertyType: 'Condo',
    propertyAddress: '123 Main Street, Suite 456',
    propertyImage: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Property+Image',
    propertyUrl: 'https://landivo.com/properties/sample',
    originalPrice: '$475,000',
    newPrice: '$450,000',
    savingsAmount: '$25,000',
    eventDate: 'Saturday, June 22, 2024',
    eventTime: '2:00 PM - 4:00 PM',
    rsvpUrl: 'https://landivo.com/events/rsvp',
    profileUrl: 'https://landivo.com/profile',
    browseUrl: 'https://landivo.com/properties',
    unsubscribeUrl: 'https://landivo.com/unsubscribe?token=sample'
  }),

  // Check if campaign can be edited
  canEditCampaign: (status) => {
    return ['draft', 'scheduled', 'paused'].includes(status);
  },

  // Check if campaign can be sent
  canSendCampaign: (status) => {
    return ['draft', 'scheduled'].includes(status);
  },

  // Check if campaign can be paused
  canPauseCampaign: (status) => {
    return ['sending', 'queued'].includes(status);
  },

  // Format date for display
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Calculate engagement score
  calculateEngagementScore: (metrics) => {
    const { totalSent, opens, clicks } = metrics;
    if (totalSent === 0) return 0;
    
    const openRate = opens / totalSent;
    const clickRate = clicks / totalSent;
    
    // Weighted score: 60% open rate, 40% click rate
    return Math.round((openRate * 60 + clickRate * 40) * 100) / 100;
  }
};

export default {
  emailCampaignApi,
  emailTemplateApi,
  emailAutomationApi,
  emailTrackingApi,
  emailListApi,
  emailMarketingUtils
};