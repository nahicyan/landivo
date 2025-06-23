import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  MailIcon, 
  SendIcon, 
  LayoutTemplate,
  BotIcon,
  BarChart3Icon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";

// Import modular components for email marketing
import EmailDashboard from "@/components/EmailMarketing/EmailDashboard";
import CampaignManager from "@/components/EmailMarketing/CampaignManager";
import EmailTemplateManager from "@/components/EmailMarketing/EmailTemplateManager";
import AutomationManager from "@/components/EmailMarketing/AutomationManager";

export default function AdminEmailMarketing() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalBuyers: 0,
    deliveryRate: 0,
    openRate: 0
  });

  useEffect(() => {
    loadEmailStats();
  }, []);

  const loadEmailStats = async () => {
    try {
      // This would fetch from your API
      // const response = await fetch('/api/email/stats');
      // const data = await response.json();
      
      // Mock data for now
      setStats({
        totalCampaigns: 15,
        totalBuyers: 1250,
        deliveryRate: 98.5,
        openRate: 24.3
      });
    } catch (error) {
      console.error("Error loading email stats:", error);
      toast.error("Failed to load email statistics");
    }
  };

  const quickActions = [
    {
      label: "Create Campaign",
      icon: <PlusIcon className="w-4 h-4" />,
      action: () => setActiveTab("campaigns"),
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      label: "New Template",
      icon: <LayoutTemplate className="w-4 h-4" />,
      action: () => setActiveTab("templates"),
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      label: "View Analytics",
      icon: <BarChart3Icon className="w-4 h-4" />,
      action: () => setActiveTab("dashboard"),
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#3f4f24]">Email Marketing</h1>
          <p className="text-[#324c48]/80 mt-1">
            Manage campaigns, templates, and buyer communications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          <div className="flex items-center gap-6 bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3f4f24]">{stats.totalCampaigns}</div>
              <div className="text-sm text-gray-600">Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3f4f24]">{stats.totalBuyers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Buyers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.deliveryRate}%</div>
              <div className="text-sm text-gray-600">Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.openRate}%</div>
              <div className="text-sm text-gray-600">Open Rate</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white`}
                size="sm"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-[#f4f7ee] grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3Icon className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <SendIcon className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <BotIcon className="w-4 h-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <EmailDashboard 
            stats={stats}
            onRefresh={loadEmailStats}
          />
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <CampaignManager />
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates">
          <EmailTemplateManager />
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <AutomationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}