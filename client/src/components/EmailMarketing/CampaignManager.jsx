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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Send,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Eye,
  Calendar,
  Users,
  Mail,
  BarChart3,
  Filter,
  Search,
  Pause,
  Play,
  Clock
} from "lucide-react";

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [emailLists, setEmailLists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form state for creating/editing campaigns
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    fromName: "Landivo",
    fromEmail: "",
    templateId: "",
    targetLists: [],
    scheduledAt: "",
    campaignType: "manual"
  });

  useEffect(() => {
    loadCampaigns();
    loadEmailLists();
    loadTemplates();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setCampaigns([
        {
          id: "1",
          name: "New Properties Alert - June",
          subject: "🏡 New Properties in Your Area",
          status: "completed",
          campaignType: "manual",
          fromName: "Landivo",
          fromEmail: "noreply@landivo.com",
          createdAt: "2024-06-15T10:00:00Z",
          scheduledAt: null,
          sentAt: "2024-06-15T14:30:00Z",
          recipients: 1250,
          opens: 306,
          clicks: 89,
          openRate: 24.5,
          clickRate: 7.1,
          bounces: 12,
          unsubscribes: 3
        },
        {
          id: "2",
          name: "Weekend Open House Invitation",
          subject: "Join Us This Weekend - Open House Events",
          status: "sending",
          campaignType: "manual",
          fromName: "Landivo Team",
          fromEmail: "events@landivo.com",
          createdAt: "2024-06-20T09:00:00Z",
          scheduledAt: "2024-06-20T11:00:00Z",
          sentAt: null,
          recipients: 800,
          opens: 45,
          clicks: 12,
          openRate: 5.6,
          clickRate: 1.5,
          bounces: 2,
          unsubscribes: 0
        },
        {
          id: "3",
          name: "Price Drop Notifications",
          subject: "Price Reduced on Your Watched Properties",
          status: "scheduled",
          campaignType: "automated",
          fromName: "Landivo Alerts",
          fromEmail: "alerts@landivo.com",
          createdAt: "2024-06-21T16:00:00Z",
          scheduledAt: "2024-06-22T09:00:00Z",
          sentAt: null,
          recipients: 650,
          opens: 0,
          clicks: 0,
          openRate: 0,
          clickRate: 0,
          bounces: 0,
          unsubscribes: 0
        },
        {
          id: "4",
          name: "Monthly Market Report",
          subject: "Your Monthly Property Market Update",
          status: "draft",
          campaignType: "manual",
          fromName: "Landivo Market Team",
          fromEmail: "market@landivo.com",
          createdAt: "2024-06-21T14:00:00Z",
          scheduledAt: null,
          sentAt: null,
          recipients: 0,
          opens: 0,
          clicks: 0,
          openRate: 0,
          clickRate: 0,
          bounces: 0,
          unsubscribes: 0
        }
      ]);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLists = async () => {
    try {
      // Mock data - replace with actual API call
      setEmailLists([
        { id: "1", name: "All Active Buyers", buyerCount: 1250 },
        { id: "2", name: "Cash Buyers", buyerCount: 450 },
        { id: "3", name: "Investors", buyerCount: 300 },
        { id: "4", name: "Builders", buyerCount: 250 },
        { id: "5", name: "VIP Buyers", buyerCount: 180 }
      ]);
    } catch (error) {
      console.error("Error loading email lists:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      // Mock data - replace with actual API call
      setTemplates([
        { id: "1", name: "New Property Alert", category: "Property Updates" },
        { id: "2", name: "Open House Invitation", category: "Events" },
        { id: "3", name: "Price Drop Alert", category: "Property Updates" },
        { id: "4", name: "Market Report", category: "Reports" },
        { id: "5", name: "Welcome Email", category: "Onboarding" }
      ]);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      if (!campaignForm.name || !campaignForm.subject || !campaignForm.templateId) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Mock API call - replace with actual implementation
      const newCampaign = {
        id: Date.now().toString(),
        ...campaignForm,
        status: "draft",
        createdAt: new Date().toISOString(),
        recipients: 0,
        opens: 0,
        clicks: 0,
        openRate: 0,
        clickRate: 0,
        bounces: 0,
        unsubscribes: 0
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      // Update campaign status to sending
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: "sending", sentAt: new Date().toISOString() }
            : campaign
        )
      );
      toast.success("Campaign sent successfully");
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error("Failed to send campaign");
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      toast.success("Campaign deleted successfully");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      const duplicatedCampaign = {
        ...campaign,
        id: Date.now().toString(),
        name: `${campaign.name} (Copy)`,
        status: "draft",
        createdAt: new Date().toISOString(),
        sentAt: null,
        recipients: 0,
        opens: 0,
        clicks: 0
      };
      
      setCampaigns(prev => [duplicatedCampaign, ...prev]);
      toast.success("Campaign duplicated successfully");
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Failed to duplicate campaign");
    }
  };

  const resetForm = () => {
    setCampaignForm({
      name: "",
      subject: "",
      fromName: "Landivo",
      fromEmail: "",
      templateId: "",
      targetLists: [],
      scheduledAt: "",
      campaignType: "manual"
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      sending: { label: "Sending", color: "bg-blue-100 text-blue-800" },
      scheduled: { label: "Scheduled", color: "bg-yellow-100 text-yellow-800" },
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      paused: { label: "Paused", color: "bg-orange-100 text-orange-800" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.color} px-2 py-1`}>
        {config.label}
      </Badge>
    );
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3f4f24]">Email Campaigns</h2>
          <p className="text-[#324c48]/80">Manage and track your email campaigns</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#D4A017] hover:bg-[#D4A017]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
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
                  placeholder="Search campaigns..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Click Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {campaign.recipients.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {campaign.opens > 0 ? (
                        <span className="text-green-600">{campaign.openRate}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {campaign.clicks > 0 ? (
                        <span className="text-blue-600">{campaign.clickRate}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {campaign.status === "draft" && (
                          <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                            <Send className="w-4 h-4 mr-2" />
                            Send Now
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new email campaign for your buyers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select 
                  value={campaignForm.campaignType} 
                  onValueChange={(value) => setCampaignForm({...campaignForm, campaignType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                placeholder="Enter email subject line"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={campaignForm.fromName}
                  onChange={(e) => setCampaignForm({...campaignForm, fromName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  value={campaignForm.fromEmail}
                  onChange={(e) => setCampaignForm({...campaignForm, fromEmail: e.target.value})}
                  placeholder="noreply@landivo.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="template">Email Template *</Label>
              <Select 
                value={campaignForm.templateId} 
                onValueChange={(value) => setCampaignForm({...campaignForm, templateId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={campaignForm.scheduledAt}
                onChange={(e) => setCampaignForm({...campaignForm, scheduledAt: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Campaign Dialog */}
      {selectedCampaign && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>Campaign details and performance metrics</DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                  </div>
                  <div>
                    <Label>Campaign Type</Label>
                    <div className="mt-1 capitalize">{selectedCampaign.campaignType}</div>
                  </div>
                  <div>
                    <Label>Subject Line</Label>
                    <div className="mt-1">{selectedCampaign.subject}</div>
                  </div>
                  <div>
                    <Label>From</Label>
                    <div className="mt-1">{selectedCampaign.fromName} &lt;{selectedCampaign.fromEmail}&gt;</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{selectedCampaign.recipients.toLocaleString()}</div>
                      <p className="text-sm text-gray-600">Recipients</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-600">{selectedCampaign.openRate}%</div>
                      <p className="text-sm text-gray-600">Open Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-blue-600">{selectedCampaign.clickRate}%</div>
                      <p className="text-sm text-gray-600">Click Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-red-600">{selectedCampaign.unsubscribes}</div>
                      <p className="text-sm text-gray-600">Unsubscribes</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="recipients">
                <div className="text-center py-8 text-gray-500">
                  Recipient details would be loaded here
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}