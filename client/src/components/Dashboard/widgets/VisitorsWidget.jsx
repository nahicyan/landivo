import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, TrendingDown, Eye, Users, BarChart3, ExternalLink
} from "lucide-react";
import { getVisitorStats, getCurrentVisitorCount } from "@/utils/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";

export default function VisitorsWidget({ isLoading }) {
  const [stats, setStats] = useState(null);
  const [currentVisitors, setCurrentVisitors] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Colors for charts
  const COLORS = ['#3f4f24', '#324c48', '#D4A017', '#8caf50', '#a3bf73'];
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getVisitorStats({ period: 'week' });
        setStats(data);
        
        const liveCount = await getCurrentVisitorCount();
        setCurrentVisitors(liveCount.currentVisitors);
        
        setError(null);
      } catch (err) {
        console.error("Error fetching visitor stats:", err);
        setError("Failed to load visitor statistics");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh current visitor count periodically
    const intervalId = setInterval(async () => {
      try {
        const liveCount = await getCurrentVisitorCount();
        setCurrentVisitors(liveCount.currentVisitors);
      } catch (err) {
        console.error("Error refreshing visitor count:", err);
      }
    }, 60000); // refresh every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate trends
  const calculateTrend = (current, previous) => {
    if (!previous) return 0;
    return previous === 0 ? 100 : ((current - previous) / previous) * 100;
  };
  
  // Format device breakdown data for pie chart
  const getDeviceData = () => {
    if (!stats || !stats.deviceBreakdown) return [];
    
    return stats.deviceBreakdown.map(item => ({
      name: item.device || 'unknown',
      value: item.count
    }));
  };
  
  // Format top pages data
  const getTopPagesData = () => {
    if (!stats || !stats.topPages) return [];
    return stats.topPages.slice(0, 5); // Top 5 pages
  };
  
  // Check if we should render the loading state
  const isLoadingState = loading || isLoading || !stats;
  
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Website Traffic</CardTitle>
            <CardDescription>Analyze visitor analytics and conversion rates</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/traffic')}
            className="flex items-center gap-1"
          >
            Learn More <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {isLoadingState ? (
              <>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-48 w-full" />
              </>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-center text-gray-500">
                {error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {/* Current Visitors */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Current</span>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{currentVisitors}</span>
                        <div className="p-2 bg-green-100 rounded-full">
                          <Eye className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unique Visitors */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Unique</span>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{stats.currentPeriod.uniqueVisitors}</span>
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      {stats.previousPeriod.uniqueVisitors > 0 && (
                        <div className="flex items-center mt-2">
                          {calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors) > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className="text-xs text-gray-500">
                            {Math.abs(calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors)).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* New Visitors */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">New</span>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{stats.currentPeriod.newVisitors}</span>
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                      </div>
                      {stats.previousPeriod.newVisitors > 0 && (
                        <div className="flex items-center mt-2">
                          {calculateTrend(stats.currentPeriod.newVisitors, stats.previousPeriod.newVisitors) > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className="text-xs text-gray-500">
                            {Math.abs(calculateTrend(stats.currentPeriod.newVisitors, stats.previousPeriod.newVisitors)).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Total Visits */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Total</span>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{stats.currentPeriod.totalVisits}</span>
                        <div className="p-2 bg-amber-100 rounded-full">
                          <BarChart3 className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>
                      {stats.previousPeriod.totalVisits > 0 && (
                        <div className="flex items-center mt-2">
                          {calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits) > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className="text-xs text-gray-500">
                            {Math.abs(calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits)).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                  <div className="h-48 text-center mt-6">
                    {/* Placeholder for chart if needed */}
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">Visitor trend data available in detailed view</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 mt-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No data</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="devices" className="space-y-4">
            {isLoadingState ? (
              <Skeleton className="h-64 w-full" />
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-center text-gray-500">
                {error}
              </div>
            ) : getDeviceData().length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="h-64">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Device Distribution</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={getDeviceData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getDeviceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} visitors`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Device Breakdown</h3>
                  <div className="space-y-3 mt-4">
                    {getDeviceData().map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-sm capitalize">{device.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{device.value}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.round((device.value / stats.currentPeriod.uniqueVisitors) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-center text-gray-500">
                No device data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pages" className="space-y-4">
            {isLoadingState ? (
              <Skeleton className="h-64 w-full" />
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-center text-gray-500">
                {error}
              </div>
            ) : getTopPagesData().length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Top Pages</h3>
                <div className="overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getTopPagesData().map((page, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-[200px]">
                            {page.page}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {page.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-center text-gray-500">
                No page data available
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {!isLoadingState && stats && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Total Unique Visitors</div>
              <div className="text-xl font-bold">{stats.currentPeriod.uniqueVisitors}</div>
              <div className="flex items-center mt-1">
                {calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors) > 0 ? (
                  <span className="text-sm text-green-500">
                    +{Math.abs(calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors)).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-sm text-red-500">
                    -{Math.abs(calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors)).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Growth</div>
              <div className="text-xl font-bold">
                {calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits) > 0 ? (
                  <span className="text-green-500">
                    +{Math.abs(calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits)).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-red-500">
                    -{Math.abs(calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits)).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}