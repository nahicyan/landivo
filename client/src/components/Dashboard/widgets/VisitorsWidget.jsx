import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Eye,
  Users,
  Calendar
} from "lucide-react";
import { getVisitorStats, getCurrentVisitorCount } from "@/utils/api";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function VisitorsWidget({ isLoading, dateRange }) {
  const [stats, setStats] = useState(null);
  const [currentVisitors, setCurrentVisitors] = useState(0);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Colors for charts
  const COLORS = ['#3f4f24', '#324c48', '#D4A017', '#8caf50', '#a3bf73'];
  
  // Fetch visitor stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const options = {
          period,
          ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
          ...(dateRange?.to && { endDate: dateRange.to.toISOString() })
        };
        
        const data = await getVisitorStats(options);
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
  }, [period, dateRange]);
  
  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const options = {
        period,
        ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
        ...(dateRange?.to && { endDate: dateRange.to.toISOString() })
      };
      
      const data = await getVisitorStats(options);
      setStats(data);
      
      const liveCount = await getCurrentVisitorCount();
      setCurrentVisitors(liveCount.currentVisitors);
      
      setError(null);
    } catch (err) {
      console.error("Error refreshing visitor stats:", err);
      setError("Failed to refresh visitor statistics");
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!stats || !stats.dailyStats || stats.dailyStats.length === 0) {
      return [];
    }
    
    return stats.dailyStats.map(day => {
      let date = new Date(day.date);
      return {
        date: `${date.getMonth()+1}/${date.getDate()}`,
        uniqueVisitors: day.uniqueVisitors || 0,
        newVisitors: day.newVisitors || 0,
        returningVisitors: day.returningVisitors || 0
      };
    });
  };
  
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
  
  // Check if we should render the loading state
  const isLoadingState = loading || isLoading || !stats;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Website Traffic</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              className={period === 'day' ? 'bg-primary-100' : ''}
              onClick={() => handlePeriodChange('day')}
            >
              Day
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={period === 'week' ? 'bg-primary-100' : ''}
              onClick={() => handlePeriodChange('week')}
            >
              Week
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={period === 'month' ? 'bg-primary-100' : ''}
              onClick={() => handlePeriodChange('month')}
            >
              Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Monitor visitor analytics and conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        {isLoadingState ? (
          <div className="p-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mx-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <RefreshCw className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-center text-gray-600 mb-4 max-w-md">
              {error}
            </p>
            <Button 
              onClick={handleRefresh}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Visitors</h3>
                    <p className="text-2xl font-bold">{currentVisitors}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Live tracking</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Unique Visitors</h3>
                    <p className="text-2xl font-bold">{stats.currentPeriod.uniqueVisitors}</p>
                  </div>
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
                    <p className="text-xs">
                      {Math.abs(calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors)).toFixed(1)}% from previous {period}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">New Visitors</h3>
                    <p className="text-2xl font-bold">{stats.currentPeriod.newVisitors}</p>
                  </div>
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
                    <p className="text-xs">
                      {Math.abs(calculateTrend(stats.currentPeriod.newVisitors, stats.previousPeriod.newVisitors)).toFixed(1)}% from previous {period}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Visits</h3>
                    <p className="text-2xl font-bold">{stats.currentPeriod.totalVisits}</p>
                  </div>
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
                    <p className="text-xs">
                      {Math.abs(calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits)).toFixed(1)}% from previous {period}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Chart */}
            <div className="px-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Visitor Trends</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="uniqueVisitors" 
                        name="Unique Visitors"
                        stroke="#3f4f24" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newVisitors" 
                        name="New Visitors"
                        stroke="#D4A017" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="returningVisitors" 
                        name="Returning Visitors"
                        stroke="#324c48" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Secondary Charts */}
            <div className="grid grid-cols-2 gap-4 px-4">
              {/* Device Distribution */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Device Distribution</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getDeviceData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getDeviceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Top Pages */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Top Pages</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.topPages || []}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="page" 
                        tick={{ fontSize: 12 }} 
                        width={120}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3f4f24" name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
}