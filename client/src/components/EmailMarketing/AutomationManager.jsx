import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  Zap,
  Clock,
  Users,
  Mail,
  Activity,
  Filter,
  Search
} from "lucide-react";

export default function AutomationManager() {
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [emailLists, setEmailLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating/editing automations
  const [automationForm, setAutomationForm] = useState({
    name: "",
    description: "",
    triggerType: "",
    conditions: {},
    templateId: "",
    targetLists: [],
    isActive: true,
    delay: 0,
    delayUnit: "minutes"
  });

  const triggerTypes = [
    { value: "property_uploaded", label: "New Property Uploaded", description: "When a new property is added to the system" },
    { value: "property_price_drop", label: "Property Price Drop", description: "When a property price is reduced" },
    { value: "buyer_registered", label: "New Buyer Registration", description: "When a new buyer joins the platform" },
    { value: "property_viewed", label: "Property Viewed", description: "When a buyer views a property multiple times" },
    { value: "buyer_inactive", label: "Buyer Inactivity", description: "When a buyer hasn't been active for a period" },
    { value: "offer_submitted", label: "Offer Submitted", description: "When a buyer submits an offer" },
    { value: "deal_closed", label: "Deal Closed", description: "When a property deal is completed" }
  ];

  useEffect(() => {
    loadAutomations();
    loadTemplates();
    loadEmailLists();
  }, []);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setAutomations([
        {
          id: "1",
          name: "Welcome New Buyers",
          description: "Send welcome email to new buyers immediately after registration",
          triggerType: "buyer_registered",
          conditions: {},
          templateId: "5",
          templateName: "Welcome New Buyer",
          targetLists: ["1"],
          isActive: true,
          delay: 0,
          delayUnit: "minutes",
          executionCount: 42,
          lastExecuted: "2024-06-21T10:30:00Z",
          createdAt: "2024-03-01T10:00:00Z"
        },
        {
          id: "2",
          name: "New Property Alerts",
          description: "Notify interested buyers when new properties match their criteria",
          triggerType: "property_uploaded",
          conditions: {
            propertyTypes: ["apartment", "house"],
            priceRange: { min: 100000, max: 500000 }
          },
          templateId: "1",
          templateName: "New Property Alert",
          targetLists: ["2", "3"],
          isActive: true,
          delay: 30,
          delayUnit: "minutes",
          executionCount: 156,
          lastExecuted: "2024-06-21T14:15:00Z",
          createdAt: "2024-04-15T09:00:00Z"
        },
        {
          id: "3",
          name: "Price Drop Notifications",
          description: "Alert buyers when prices drop on their watched properties",
          triggerType: "property_price_drop",
          conditions: {
            minimumReduction: 5000
          },
          templateId: "3",
          templateName: "Price Drop Alert",
          targetLists: ["1"],
          isActive: true,
          delay: 15,
          delayUnit: "minutes",
          executionCount: 28,
          lastExecuted: "2024-06-20T16:45:00Z",
          createdAt: "2024-05-01T11:00:00Z"
        },
        {
          id: "4",
          name: "Inactive Buyer Re-engagement",
          description: "Re-engage buyers who haven't been active for 30 days",
          triggerType: "buyer_inactive",
          conditions: {
            inactiveDays: 30
          },
          templateId: "4",
          templateName: "Monthly Market Report",
          targetLists: ["1"],
          isActive: false,
          delay: 0,
          delayUnit: "hours",
          executionCount: 12,
          lastExecuted: "2024-06-15T09:00:00Z",
          createdAt: "2024-05-20T14:30:00Z"
        }
      ]);
    } catch (error) {
      console.error("Error loading automations:", error);
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplates([
        { id: "1", name: "New Property Alert" },
        { id: "2", name: "Open House Invitation" },
        { id: "3", name: "Price Drop Alert" },
        { id: "4", name: "Monthly Market Report" },
        { id: "5", name: "Welcome New Buyer" }
      ]);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadEmailLists = async () => {
    try {
      setEmailLists([
        { id: "1", name: "All Active Buyers" },
        { id: "2", name: "Cash Buyers" },
        { id: "3", name: "Investors" },
        { id: "4", name: "Builders" },
        { id: "5", name: "VIP Buyers" }
      ]);
    } catch (error) {
      console.error("Error loading email lists:", error);
    }
  };

  const handleCreateAutomation = async () => {
    try {
      if (!automationForm.name || !automationForm.triggerType || !automationForm.templateId) {
        toast.error("Please fill in all required fields");
        return;
      }

      const template = templates.find(t => t.id === automationForm.templateId);
      const newAutomation = {
        id: Date.now().toString(),
        ...automationForm,
        templateName: template?.name || "",
        executionCount: 0,
        lastExecuted: null,
        createdAt: new Date().toISOString()
      };

      setAutomations(prev => [newAutomation, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Automation created successfully");
    } catch (error) {
      console.error("Error creating automation:", error);
      toast.error("Failed to create automation");
    }
  };

  const handleUpdateAutomation = async () => {
    try {
      const template = templates.find(t => t.id === automationForm.templateId);
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === selectedAutomation.id 
            ? { ...automation, ...automationForm, templateName: template?.name || "" }
            : automation
        )
      );
      setIsEditDialogOpen(false);
      setSelectedAutomation(null);
      resetForm();
      toast.success("Automation updated successfully");
    } catch (error) {
      console.error("Error updating automation:", error);
      toast.error("Failed to update automation");
    }
  };

  const handleToggleAutomation = async (automationId, isActive) => {
    try {
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === automationId 
            ? { ...automation, isActive }
            : automation
        )
      );
      toast.success(`Automation ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast.error("Failed to toggle automation");
    }
  };

  const handleDeleteAutomation = async (automationId) => {
    try {
      setAutomations(prev => prev.filter(automation => automation.id !== automationId));
      toast.success("Automation deleted successfully");
    } catch (error) {
      console.error("Error deleting automation:", error);
      toast.error("Failed to delete automation");
    }
  };

  const resetForm = () => {
    setAutomationForm({
      name: "",
      description: "",
      triggerType: "",
      conditions: {},
      templateId: "",
      targetLists: [],
      isActive: true,
      delay: 0,
      delayUnit: "minutes"
    });
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge className={`px-2 py-1 ${
        isActive 
          ? "bg-green-100 text-green-800" 
          : "bg-gray-100 text-gray-800"
      }`}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getTriggerTypeName = (triggerType) => {
    const trigger = triggerTypes.find(t => t.value === triggerType);
    return trigger?.label || triggerType;
  };

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         automation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && automation.isActive) ||
                         (statusFilter === "inactive" && !automation.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3f4f24]">Email Automation</h2>
          <p className="text-[#324c48]/80">Set up automated email workflows based on buyer actions</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#D4A017] hover:bg-[#D4A017]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Automations</p>
                <p className="text-2xl font-bold text-[#3f4f24]">
                  {automations.filter(a => a.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-[#3f4f24]">
                  {automations.reduce((sum, a) => sum + a.executionCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-[#3f4f24]">
                  {Math.floor(automations.reduce((sum, a) => sum + a.executionCount, 0) * 0.3)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search automations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Automations</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automations ({filteredAutomations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{automation.name}</div>
                      <div className="text-sm text-gray-500">{automation.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{getTriggerTypeName(automation.triggerType)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{automation.templateName}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(automation.isActive)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{automation.executionCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {automation.lastExecuted 
                        ? new Date(automation.lastExecuted).toLocaleDateString()
                        : "Never"
                      }
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={automation.isActive}
                        onCheckedChange={(checked) => handleToggleAutomation(automation.id, checked)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedAutomation(automation);
                              setAutomationForm({
                                name: automation.name,
                                description: automation.description,
                                triggerType: automation.triggerType,
                                conditions: automation.conditions,
                                templateId: automation.templateId,
                                targetLists: automation.targetLists,
                                isActive: automation.isActive,
                                delay: automation.delay,
                                delayUnit: automation.delayUnit
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAutomation(automation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Automation Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedAutomation(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Automation" : "Create New Automation"}
            </DialogTitle>
            <DialogDescription>
              Set up automated email workflows for your buyers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Automation Name *</Label>
                <Input
                  id="name"
                  value={automationForm.name}
                  onChange={(e) => setAutomationForm({...automationForm, name: e.target.value})}
                  placeholder="Enter automation name"
                />
              </div>
              <div>
                <Label htmlFor="triggerType">Trigger Event *</Label>
                <Select 
                  value={automationForm.triggerType} 
                  onValueChange={(value) => setAutomationForm({...automationForm, triggerType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={automationForm.description}
                onChange={(e) => setAutomationForm({...automationForm, description: e.target.value})}
                placeholder="Describe what this automation does"
              />
            </div>

            <div>
              <Label htmlFor="template">Email Template *</Label>
              <Select 
                value={automationForm.templateId} 
                onValueChange={(value) => setAutomationForm({...automationForm, templateId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delay">Delay</Label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  value={automationForm.delay}
                  onChange={(e) => setAutomationForm({...automationForm, delay: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="delayUnit">Unit</Label>
                <Select 
                  value={automationForm.delayUnit} 
                  onValueChange={(value) => setAutomationForm({...automationForm, delayUnit: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={automationForm.isActive}
                    onCheckedChange={(checked) => setAutomationForm({...automationForm, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedAutomation(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdateAutomation : handleCreateAutomation}>
              {isEditDialogOpen ? "Update Automation" : "Create Automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}