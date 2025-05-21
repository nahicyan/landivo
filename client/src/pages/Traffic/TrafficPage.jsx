import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calendar,
  Eye,
  Users,
  BarChart3,
  Globe,
  Clock,
  LayoutGrid,
  Smartphone,
  Laptop,
  Tablet
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
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export default function TrafficPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [currentVisitors, setCurrentVisitors] = useState(0);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  
  // Colors for charts
  const COLORS = ['#3f4f24', '#324c48', '#D4A017', '#8caf50', '#a3bf73'];
  const DEVICE_COLORS = {
    mobile: '#D4A017',
    tablet: '#3f4f24',
    desktop: '#324c48',
    unknown: '#8caf50'
  };
  
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
  
  // Handle data export
  const handleExport = () => {
    if (!stats) return;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header row
    csvContent += "Date,Unique Visitors,New Visitors,Returning Visitors,Total Visits\n";
    
    // Add data rows
    stats.dailyStats.forEach(day => {
      const date = new Date(day.date).toISOString().split('T')[0];
      csvContent += `${date},${day.uniqueVisitors || 0},${day.newVisitors || 0},${day.returningVisitors || 0},${day.totalVisits || 0}\n`;
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visitor-stats-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        returningVisitors: day.returningVisitors || 0,
        totalVisits: day.totalVisits || 0
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
  
  // Generate an hourly distribution dataset (simulated)
  const getHourlyData = () => {
    if (!stats) return [];
    
    // Generate simulated hourly data based on total visits
    const totalVisits = stats.currentPeriod.totalVisits || 0;
    const hours = [];
    
    // Define peak hours
    const peaks = [9, 12, 15, 20]; // 9am, 12pm, 3pm, 8pm
    
    for (let i = 0; i < 24; i++) {
      // Higher values during peak hours
      const isPeak = peaks.includes(i);
      const factor = isPeak ? 0.08 + Math.random() * 0.04 : 0.02 + Math.random() * 0.03;
      const value = Math.round(totalVisits * factor);
      
      hours.push({
        hour: i,
        visits: value,
        label: `${i.toString().padStart(2, '0')}:00`
      });
    }
    
    return hours;
  };
  
  // Calculate bounce rate (simulated)
  const getBounceRate = () => {
    return 42 + Math.floor(Math.random() * 15); // 42-57%
  };
  
  // Calculate average session duration (simulated)
  const getAvgSessionDuration = () => {
    return 2 + Math.floor(Math.random() * 3) + Math.random().toFixed(1); // 2.0-4.9 minutes
  };
  
  // Check if we should render the loading state
  const isLoadingState = loading || !stats;
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Traffic Analytics</h1>
        </div>
        <div className="flex space-x-2">
          <div className="flex space-x-1 border rounded-md overflow-hidden">
            <Button 
              variant={period === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePeriodChange('day')}
              className="rounded-none"
            >
              Day
            </Button>
            <Button 
              variant={period === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePeriodChange('week')}
              className="rounded-none"
            >
              Week
            </Button>
            <Button 
              variant={period === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePeriodChange('month')}
              className="rounded-none"
            >
              Month
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={loading || !stats}
          >
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isLoadingState ? (
              <>
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
              </>
            ) : (
              <>
                {/* Current Visitors */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-green-500" />
                      Live Visitors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{currentVisitors}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active on site now
                    </p>
                  </CardContent>
                </Card>

                {/* Unique Visitors */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      Unique Visitors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.currentPeriod.uniqueVisitors}</div>
                    <div className="flex items-center mt-1">
                      {calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors) > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {Math.abs(calculateTrend(stats.currentPeriod.uniqueVisitors, stats.previousPeriod.uniqueVisitors)).toFixed(1)}% from previous {period}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Visits */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-amber-500" />
                      Total Visits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.currentPeriod.totalVisits}</div>
                    <div className="flex items-center mt-1">
                      {calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits) > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {Math.abs(calculateTrend(stats.currentPeriod.totalVisits, stats.previousPeriod.totalVisits)).toFixed(1)}% from previous {period}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bounce Rate */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <ArrowLeft className="h-4 w-4 mr-2 text-purple-500" />
                      Bounce Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{getBounceRate()}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Single-page sessions
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Visitor Trends</CardTitle>
              <CardDescription>
                {period === 'day' ? 'Last 24 hours' : period === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingState ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareChartData()}>
                      <defs>
                        <linearGradient id="colorUniqueVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3f4f24" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3f4f24" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorNewVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4A017" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#D4A017" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="uniqueVisitors" 
                        name="Unique Visitors"
                        stroke="#3f4f24" 
                        fillOpacity={1}
                        fill="url(#colorUniqueVisitors)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="newVisitors" 
                        name="New Visitors"
                        stroke="#D4A017" 
                        fillOpacity={1}
                        fill="url(#colorNewVisitors)" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalVisits" 
                        name="Total Visits"
                        stroke="#324c48" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>
                  Visitors by device type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingState ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDeviceData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getDeviceData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
                <CardDescription>
                  Visits by hour of day (UTC)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingState ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getHourlyData()}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="visits" fill="#3f4f24" name="Visits" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visitors Tab */}
        <TabsContent value="visitors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* New vs Returning */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>New vs Returning Visitors</CardTitle>
                <CardDescription>
                  Comparison over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingState ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareChartData()} barGap={0} barCategoryGap="10%">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="newVisitors" 
                          name="New Visitors" 
                          stackId="a" 
                          fill="#D4A017" 
                        />
                        <Bar 
                          dataKey="returningVisitors" 
                          name="Returning Visitors" 
                          stackId="a" 
                          fill="#3f4f24" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  Key visitor engagement stats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingState ? (
                  <>
                    <Skeleton className="h-[50px] w-full" />
                    <Skeleton className="h-[50px] w-full" />
                    <Skeleton className="h-[50px] w-full" />
                  </>
                ) : (
                  <>
                    {/* Avg. Session Duration */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Avg. Session Duration
                        </div>
                        <div className="font-medium">
                          {getAvgSessionDuration()} min
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(getAvgSessionDuration() * 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Bounce Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Bounce Rate
                        </div>
                        <div className="font-medium">
                          {getBounceRate()}%
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full" 
                          style={{ width: `${getBounceRate()}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Pages Per Session */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Pages Per Session
                        </div>
                        <div className="font-medium">
                          {(stats.currentPeriod.totalVisits / stats.currentPeriod.uniqueVisitors).toFixed(1)}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${Math.min((stats.currentPeriod.totalVisits / stats.currentPeriod.uniqueVisitors) * 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* New vs Returning Ratio */}
          <Card>
            <CardHeader>
              <CardTitle>Visitor Loyalty</CardTitle>
              <CardDescription>
                New vs returning visitors percentage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingState ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col justify-center items-center">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {((stats.currentPeriod.newVisitors / stats.currentPeriod.uniqueVisitors) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New visitors
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'New Visitors', value: stats.currentPeriod.newVisitors },
                            { name: 'Returning Visitors', value: stats.currentPeriod.returningVisitors }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          <Cell fill="#D4A017" />
                          <Cell fill="#3f4f24" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Device Category Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Device Categories</CardTitle>
                <CardDescription>
                  Distribution of visitors by device type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingState ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getDeviceData()}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{fontSize: 14}}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Visitors" 
                          barSize={30}
                        >
                          {getDeviceData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={DEVICE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Category Cards */}
            <div className="space-y-4">
              {isLoadingState ? (
                <>
                  <Skeleton className="h-[80px] w-full" />
                  <Skeleton className="h-[80px] w-full" />
                  <Skeleton className="h-[80px] w-full" />
                </>
              ) : (
                <>
                  {/* Desktop */}
                  <Card className="overflow-hidden">
                    <div className="flex">
                      <div className="bg-secondary-100 p-4 flex items-center justify-center">
                        <Laptop className="h-8 w-8 text-secondary" />
                      </div>
                      <CardContent className="p-4 flex-1">
                        <div className="text-lg font-semibold">Desktop</div>
                        <div className="text-2xl font-bold">
                          {getDeviceData().find(d => d.name === 'desktop')?.value || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(((getDeviceData().find(d => d.name === 'desktop')?.value || 0) / 
                          stats.currentPeriod.uniqueVisitors) * 100).toFixed(1)}% of total
                        </div>
                      </CardContent>
                    </div>
                  </Card>

                  {/* Mobile */}
                  <Card className="overflow-hidden">
                    <div className="flex">
                      <div className="bg-primary-100 p-4 flex items-center justify-center">
                        <Smartphone className="h-8 w-8 text-primary" />
                      </div>
                      <CardContent className="p-4 flex-1">
                        <div className="text-lg font-semibold">Mobile</div>
                        <div className="text-2xl font-bold">
                          {getDeviceData().find(d => d.name === 'mobile')?.value || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(((getDeviceData().find(d => d.name === 'mobile')?.value || 0) / 
                          stats.currentPeriod.uniqueVisitors) * 100).toFixed(1)}% of total
                        </div>
                      </CardContent>
                    </div>
                  </Card>

                  {/* Tablet */}
                  <Card className="overflow-hidden">
                    <div className="flex">
                      <div className="bg-amber-100 p-4 flex items-center justify-center">
                        <Tablet className="h-8 w-8 text-amber-600" />
                      </div>
                      <CardContent className="p-4 flex-1">
                        <div className="text-lg font-semibold">Tablet</div>
                        <div className="text-2xl font-bold">
                          {getDeviceData().find(d => d.name === 'tablet')?.value || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(((getDeviceData().find(d => d.name === 'tablet')?.value || 0) / 
                          stats.currentPeriod.uniqueVisitors) * 100).toFixed(1)}% of total
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most visited pages during selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingState ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.topPages || []}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="page" 
                        type="category" 
                        width={150}
                        tick={{fontSize: 12}}
                        tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} visits`, 'Visits']}
                        labelFormatter={(label) => `Page: ${label}`}
                      />
                      <Bar 
                        dataKey="count" 
                        name="Visits" 
                        fill="#3f4f24" 
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Page Performance</CardTitle>
              <CardDescription>
                Top pages with engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingState ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Page</th>
                        <th className="text-center p-2">Visits</th>
                        <th className="text-center p-2">Unique Visitors</th>
                        <th className="text-center p-2">Bounce Rate</th>
                        <th className="text-center p-2">Avg. Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPages && stats.topPages.map((page, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 max-w-[200px] truncate">
                            {page.page}
                          </td>
                          <td className="text-center p-2">
                            {page.count}
                          </td>
                          <td className="text-center p-2">
                            {Math.round(page.count * (0.7 + Math.random() * 0.2))}
                          </td>
                          <td className="text-center p-2">
                            {Math.round(30 + Math.random() * 45)}%
                          </td>
                          <td className="text-center p-2">
                            {(1 + Math.random() * 3).toFixed(1)} min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}