import React, { useState, useEffect } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Eye,
  MousePointer,
  RefreshCw,
  Calendar,
  Send,
  AlertCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

export default function EmailDashboard({ stats, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [campaignData, setCampaignData] = useState([]);
  const [buyerSegments, setBuyerSegments] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setCampaignData([
        { name: 'Jan', sent: 4000, opens: 1200, clicks: 400 },
        { name: 'Feb', sent: 3000, opens: 1398, clicks: 500 },
        { name: 'Mar', sent: 2000, opens: 800, clicks: 200 },
        { name: 'Apr', sent: 2780, opens: 1200, clicks: 600 },
        { name: 'May', sent: 1890, opens: 800, clicks: 300 },
        { name: 'Jun', sent: 2390, opens: 1000, clicks: 450 }
      ]);

      setBuyerSegments([
        { name: 'Cash Buyers', value: 450, color: '#8884d8' },
        { name: 'Investors', value: 300, color: '#82ca9d' },
        { name: 'Builders', value: 250, color: '#ffc658' },
        { name: 'Realtors', value: 200, color: '#ff7300' },
        { name: 'Others', value: 50, color: '#00ff88' }
      ]);

      setRecentCampaigns([
        {
          id: 1,
          name: "New Properties Alert - June",
          status: "completed",
          sentAt: "2024-06-15",
          recipients: 1250,
          openRate: 24.5,
          clickRate: 8.2
        },
        {
          id: 2,
          name: "Weekend Open House Invitation",
          status: "sending",
          sentAt: "2024-06-20",
          recipients: 800,
          openRate: 0,
          clickRate: 0
        },
        {
          id: 3,
          name: "Price Drop Notifications",
          status: "scheduled",
          sentAt: "2024-06-22",
          recipients: 650,
          openRate: 0,
          clickRate: 0
        }
      ]);

      setPerformanceMetrics([
        { name: 'Mon', delivered: 890, bounced: 12, unsubscribed: 3 },
        { name: 'Tue', delivered: 1200, bounced: 8, unsubscribed: 5 },
        { name: 'Wed', delivered: 950, bounced: 15, unsubscribed: 2 },
        { name: 'Thu', delivered: 1100, bounced: 6, unsubscribed: 4 },
        { name: 'Fri', delivered: 1350, bounced: 9, unsubscribed: 7 },
        { name: 'Sat', delivered: 800, bounced: 5, unsubscribed: 1 },
        { name: 'Sun', delivered: 600, bounced: 3, unsubscribed: 2 }
      ]);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData();
    if (onRefresh) {
      await onRefresh();
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      sending: { label: "Sending", color: "bg-blue-100 text-blue-800" },
      scheduled: { label: "Scheduled", color: "bg-yellow-100 text-yellow-800" },
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.color} px-2 py-1`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#3f4f24]">Email Marketing Dashboard</h2>
        <Button 
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3f4f24]">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3f4f24]">{stats.totalBuyers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              Industry average: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              Industry average: 21%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Campaign Performance
            </CardTitle>
            <CardDescription>
              Email metrics over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Emails Sent" />
                <Line type="monotone" dataKey="opens" stroke="#82ca9d" name="Opens" />
                <Line type="monotone" dataKey="clicks" stroke="#ffc658" name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Buyer Segments Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Buyer Segments
            </CardTitle>
            <CardDescription>
              Distribution of buyers by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={buyerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {buyerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>
              Latest email campaigns and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {campaign.recipients.toLocaleString()} recipients • {campaign.sentAt}
                    </div>
                    {campaign.status === 'completed' && (
                      <div className="text-sm text-gray-500 mt-1">
                        {campaign.openRate}% open rate • {campaign.clickRate}% click rate
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Performance
            </CardTitle>
            <CardDescription>
              Delivery metrics for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                <Bar dataKey="bounced" fill="#ff7300" name="Bounced" />
                <Bar dataKey="unsubscribed" fill="#8884d8" name="Unsubscribed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-blue-900">Improve Subject Lines</h4>
                <p className="text-blue-800 text-sm">Your open rates could increase by optimizing subject lines. A/B test different approaches.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-green-900">Schedule Optimization</h4>
                <p className="text-green-800 text-sm">Your best performing emails are sent on Tuesday-Thursday at 10 AM.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-yellow-900">Segment Performance</h4>
                <p className="text-yellow-800 text-sm">Cash buyers have 35% higher engagement rates. Consider targeted campaigns.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}