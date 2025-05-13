// client/src/components/Dashboard/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  Download, 
  RefreshCw, 
  BarChart3, 
  Users, 
  Home, 
  Building2
} from "lucide-react";

// Import dashboard widgets
import DealsWidget from "./widgets/DealsWidget";
import StatCards from "./widgets/StatCards";
import FinanceWidget from "./widgets/FinanceWidget";
import ActivityWidget from "./widgets/ActivityWidget";
import PropertiesWidget from "./widgets/PropertiesWidget";
import BuyersWidget from "./widgets/BuyersWidget";
import BuyerListsWidget from "./widgets/BuyerListsWidget";
import EmailReportWidget from "./widgets/EmailReportWidget";
import QualificationsWidget from "./widgets/QualificationsWidget";
import VisitorsWidget from "./widgets/VisitorsWidget";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-5 w-full max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#324c48] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#324c48]/70">Welcome to your Landivo admin dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 border-[#324c48]/30 text-[#324c48] hover:bg-[#324c48]/10 hover:text-[#324c48]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 border-[#324c48]/30 text-[#324c48] hover:bg-[#324c48]/10 hover:text-[#324c48]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-gradient-to-r from-[#fcfaf6] to-[#f4f7ee] border border-[#324c48]/10 rounded-lg p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#546930]/25 data-[state=active]:to-[#546930]/15 data-[state=active]:text-[#324c48] data-[state=active]:shadow-sm text-[#324c48]/70 py-2"
          >
            <Home className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="finance" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#546930]/25 data-[state=active]:to-[#546930]/15 data-[state=active]:text-[#324c48] data-[state=active]:shadow-sm text-[#324c48]/70 py-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Finance
          </TabsTrigger>
          <TabsTrigger 
            value="buyers" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#546930]/25 data-[state=active]:to-[#546930]/15 data-[state=active]:text-[#324c48] data-[state=active]:shadow-sm text-[#324c48]/70 py-2"
          >
            <Users className="h-4 w-4 mr-2" />
            Buyers
          </TabsTrigger>
          <TabsTrigger 
            value="properties" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#546930]/25 data-[state=active]:to-[#546930]/15 data-[state=active]:text-[#324c48] data-[state=active]:shadow-sm text-[#324c48]/70 py-2"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 w-full">
          {/* Stats cards at the top */}
          <StatCards isLoading={isLoading} />
          
          {/* Chart widgets with clear spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Financial Performance</h3>
                <p className="text-xs text-[#324c48]/70">Track revenue, profits, and sales performance over time</p>
              </div>
              <div className="p-4">
                <FinanceWidget isLoading={isLoading} dateRange={dateRange} />
              </div>
            </Card>
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Website Traffic</h3>
                <p className="text-xs text-[#324c48]/70">Analyze visitor analytics and conversion rates</p>
              </div>
              <div className="p-4">
                <VisitorsWidget isLoading={isLoading} dateRange={dateRange} />
              </div>
            </Card>
          </div>
          
          {/* Bottom row widgets with clear separation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Recent Deals</h3>
                <p className="text-xs text-[#324c48]/70">Latest financing deals and their status</p>
              </div>
              <div className="p-4">
                <DealsWidget isLoading={isLoading} />
              </div>
            </Card>
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Recent Buyer Activity</h3>
                <p className="text-xs text-[#324c48]/70">Latest transactions from VIP buyers</p>
              </div>
              <div className="p-4">
                <ActivityWidget isLoading={isLoading} />
              </div>
            </Card>
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Recent Properties</h3>
                <p className="text-xs text-[#324c48]/70">Newest property listings and updates</p>
              </div>
              <div className="p-4">
                <PropertiesWidget isLoading={isLoading} />
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="finance" className="space-y-6">
          <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
            <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
              <h3 className="text-lg font-semibold text-[#324c48]">Financial Analysis</h3>
              <p className="text-xs text-[#324c48]/70">Comprehensive financial performance metrics</p>
            </div>
            <div className="p-4">
              <FinanceWidget isLoading={isLoading} dateRange={dateRange} fullSize />
            </div>
          </Card>
          <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
            <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
              <h3 className="text-lg font-semibold text-[#324c48]">Financing Qualifications</h3>
              <p className="text-xs text-[#324c48]/70">Buyer qualification statistics and trends</p>
            </div>
            <div className="p-4">
              <QualificationsWidget isLoading={isLoading} />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="buyers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Buyer Analytics</h3>
                <p className="text-xs text-[#324c48]/70">Buyer activities and engagement metrics</p>
              </div>
              <div className="p-4">
                <BuyersWidget isLoading={isLoading} fullSize />
              </div>
            </Card>
            <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
              <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
                <h3 className="text-lg font-semibold text-[#324c48]">Buyer Lists</h3>
                <p className="text-xs text-[#324c48]/70">Active buyer lists and membership stats</p>
              </div>
              <div className="p-4">
                <BuyerListsWidget isLoading={isLoading} />
              </div>
            </Card>
          </div>
          <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
            <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
              <h3 className="text-lg font-semibold text-[#324c48]">Email Campaign Performance</h3>
              <p className="text-xs text-[#324c48]/70">Open rates, click-through rates, and conversions</p>
            </div>
            <div className="p-4">
              <EmailReportWidget isLoading={isLoading} />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties" className="space-y-6">
          <Card className="overflow-hidden rounded-xl border border-[#324c48]/10 shadow-sm">
            <div className="p-4 bg-gradient-to-r from-[#324c48]/10 to-[#324c48]/5 border-b border-[#324c48]/10">
              <h3 className="text-lg font-semibold text-[#324c48]">Property Management</h3>
              <p className="text-xs text-[#324c48]/70">Complete property inventory and performance metrics</p>
            </div>
            <div className="p-4">
              <PropertiesWidget isLoading={isLoading} fullSize />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}