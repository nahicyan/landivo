import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Eye,
  Search,
  Filter,
  FileText,
  Code,
  Palette,
  Layout,
  Mail,
  Send
} from "lucide-react";

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating/editing templates
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "",
    subject: "",
    htmlContent: "",
    variables: []
  });

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setTemplates([
        {
          id: "1",
          name: "New Property Alert",
          description: "Notify buyers about new properties matching their criteria",
          category: "Property Updates",
          subject: "🏡 New Property Alert: {{propertyTitle}}",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3f4f24;">New Property Alert</h2>
              <p>Hi {{buyerName}},</p>
              <p>We have a new property that matches your criteria:</p>
              <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                <h3>{{propertyTitle}}</h3>
                <p><strong>Price:</strong> {{propertyPrice}}</p>
                <p><strong>Location:</strong> {{propertyLocation}}</p>
                <p><strong>Type:</strong> {{propertyType}}</p>
                <img src="{{propertyImage}}" style="max-width: 100%; height: auto;" />
              </div>
              <a href="{{propertyUrl}}" style="background: #D4A017; color: white; padding: 10px 20px; text-decoration: none;">View Property</a>
            </div>
          `,
          variables: ["buyerName", "propertyTitle", "propertyPrice", "propertyLocation", "propertyType", "propertyImage", "propertyUrl"],
          isActive: true,
          usageCount: 15,
          createdAt: "2024-06-01T10:00:00Z",
          updatedAt: "2024-06-15T14:30:00Z"
        },
        {
          id: "2",
          name: "Open House Invitation",
          description: "Invite buyers to open house events",
          category: "Events",
          subject: "Join Us This Weekend - Open House at {{propertyAddress}}",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3f4f24;">You're Invited to Our Open House</h2>
              <p>Dear {{buyerName}},</p>
              <p>Join us for an exclusive open house event:</p>
              <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
                <h3>{{propertyTitle}}</h3>
                <p><strong>Date:</strong> {{eventDate}}</p>
                <p><strong>Time:</strong> {{eventTime}}</p>
                <p><strong>Address:</strong> {{propertyAddress}}</p>
              </div>
              <p>Light refreshments will be provided.</p>
              <a href="{{rsvpUrl}}" style="background: #D4A017; color: white; padding: 10px 20px; text-decoration: none;">RSVP Now</a>
            </div>
          `,
          variables: ["buyerName", "propertyTitle", "eventDate", "eventTime", "propertyAddress", "rsvpUrl"],
          isActive: true,
          usageCount: 8,
          createdAt: "2024-05-15T09:00:00Z",
          updatedAt: "2024-06-10T11:20:00Z"
        },
        {
          id: "3",
          name: "Price Drop Alert",
          description: "Notify buyers when property prices are reduced",
          category: "Property Updates",
          subject: "Price Reduced! {{propertyTitle}} - Save {{savingsAmount}}",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d32f2f;">Price Drop Alert! 📉</h2>
              <p>Hi {{buyerName}},</p>
              <p>Great news! The price has been reduced on a property you're watching:</p>
              <div style="border: 2px solid #d32f2f; padding: 20px; margin: 20px 0;">
                <h3>{{propertyTitle}}</h3>
                <p><span style="text-decoration: line-through;">{{originalPrice}}</span> <strong style="color: #d32f2f;">{{newPrice}}</strong></p>
                <p><strong>You Save: {{savingsAmount}}</strong></p>
                <p><strong>Location:</strong> {{propertyLocation}}</p>
              </div>
              <p>This is a limited-time opportunity. Act fast!</p>
              <a href="{{propertyUrl}}" style="background: #d32f2f; color: white; padding: 10px 20px; text-decoration: none;">View Now</a>
            </div>
          `,
          variables: ["buyerName", "propertyTitle", "originalPrice", "newPrice", "savingsAmount", "propertyLocation", "propertyUrl"],
          isActive: true,
          usageCount: 22,
          createdAt: "2024-05-20T14:00:00Z",
          updatedAt: "2024-06-18T16:45:00Z"
        },
        {
          id: "4",
          name: "Monthly Market Report",
          description: "Monthly real estate market insights and trends",
          category: "Reports",
          subject: "Your Monthly Property Market Update - {{month}} {{year}}",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3f4f24;">Market Report - {{month}} {{year}}</h2>
              <p>Hello {{buyerName}},</p>
              <p>Here's your monthly market update for {{marketArea}}:</p>
              <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
                <h3>Key Metrics</h3>
                <p><strong>Average Price:</strong> {{averagePrice}}</p>
                <p><strong>Price Change:</strong> {{priceChange}}</p>
                <p><strong>Properties Sold:</strong> {{propertiesSold}}</p>
                <p><strong>Days on Market:</strong> {{daysOnMarket}}</p>
              </div>
              <p>{{marketInsights}}</p>
              <a href="{{fullReportUrl}}" style="background: #3f4f24; color: white; padding: 10px 20px; text-decoration: none;">Read Full Report</a>
            </div>
          `,
          variables: ["buyerName", "month", "year", "marketArea", "averagePrice", "priceChange", "propertiesSold", "daysOnMarket", "marketInsights", "fullReportUrl"],
          isActive: true,
          usageCount: 5,
          createdAt: "2024-04-01T12:00:00Z",
          updatedAt: "2024-06-01T09:15:00Z"
        },
        {
          id: "5",
          name: "Welcome New Buyer",
          description: "Welcome email for new buyers joining the platform",
          category: "Onboarding",
          subject: "Welcome to Landivo, {{buyerName}}!",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3f4f24;">Welcome to Landivo! 🎉</h2>
              <p>Hi {{buyerName}},</p>
              <p>Welcome to Landivo, your premier destination for property investments!</p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your buyer profile</li>
                <li>Set your property preferences</li>
                <li>Browse our latest listings</li>
                <li>Set up property alerts</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{profileUrl}}" style="background: #D4A017; color: white; padding: 12px 24px; text-decoration: none; margin-right: 10px;">Complete Profile</a>
                <a href="{{browseUrl}}" style="background: #3f4f24; color: white; padding: 12px 24px; text-decoration: none;">Browse Properties</a>
              </div>
              <p>If you have any questions, our team is here to help!</p>
            </div>
          `,
          variables: ["buyerName", "profileUrl", "browseUrl"],
          isActive: true,
          usageCount: 42,
          createdAt: "2024-03-01T10:00:00Z",
          updatedAt: "2024-05-15T13:30:00Z"
        }
      ]);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories([
        "Property Updates",
        "Events",
        "Reports",
        "Onboarding",
        "Promotional",
        "Notifications"
      ]);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
        toast.error("Please fill in all required fields");
        return;
      }

      const newTemplate = {
        id: Date.now().toString(),
        ...templateForm,
        isActive: true,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Template created successfully");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setTemplates(prev => 
        prev.map(template => 
          template.id === selectedTemplate.id 
            ? { ...template, ...templateForm, updatedAt: new Date().toISOString() }
            : template
        )
      );
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      resetForm();
      toast.success("Template updated successfully");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      toast.success("Template deleted successfully");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      const duplicatedTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      toast.success("Template duplicated successfully");
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      category: "",
      subject: "",
      htmlContent: "",
      variables: []
    });
  };

  const extractVariables = (content) => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const handleContentChange = (content) => {
    const variables = extractVariables(content);
    setTemplateForm({
      ...templateForm,
      htmlContent: content,
      variables
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3f4f24]">Email Templates</h2>
          <p className="text-[#324c48]/80">Create and manage email templates for your campaigns</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#D4A017] hover:bg-[#D4A017]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTemplate(template);
                        setTemplateForm({
                          name: template.name,
                          description: template.description,
                          category: template.category,
                          subject: template.subject,
                          htmlContent: template.htmlContent,
                          variables: template.variables
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{template.category}</Badge>
                  <span className="text-sm text-gray-500">{template.usageCount} uses</span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Subject:</p>
                  <p className="text-sm font-medium truncate">{template.subject}</p>
                </div>
                
                {template.variables.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map(variable => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.variables.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Template Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              Design email templates for your buyer communications
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={templateForm.category} 
                    onValueChange={(value) => setTemplateForm({...templateForm, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  placeholder="Describe what this template is used for"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                  placeholder="Enter email subject line (use {{variable}} for dynamic content)"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div>
                <Label htmlFor="htmlContent">HTML Content *</Label>
                <Textarea
                  id="htmlContent"
                  value={templateForm.htmlContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter HTML content for the email template"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              
              {templateForm.variables.length > 0 && (
                <div>
                  <Label>Detected Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {templateForm.variables.map(variable => (
                      <Badge key={variable} variant="secondary">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Subject Preview:</h4>
                <p className="text-sm">{templateForm.subject || "No subject set"}</p>
              </div>
              
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-medium mb-2">Content Preview:</h4>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: templateForm.htmlContent || "<p>No content set</p>" 
                  }} 
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedTemplate(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdateTemplate : handleCreateTemplate}>
              {isEditDialogOpen ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      {selectedTemplate && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
              <DialogDescription>{selectedTemplate.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm">{selectedTemplate.category}</p>
                </div>
                <div>
                  <Label>Usage Count</Label>
                  <p className="text-sm">{selectedTemplate.usageCount} campaigns</p>
                </div>
              </div>
              
              <div>
                <Label>Subject Line</Label>
                <p className="text-sm font-medium">{selectedTemplate.subject}</p>
              </div>
              
              <div>
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTemplate.variables.map(variable => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>HTML Preview</Label>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}