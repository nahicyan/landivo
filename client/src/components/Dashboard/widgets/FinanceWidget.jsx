// client/src/components/Dashboard/widgets/FinanceWidget.jsx

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, BarChart } from "@/components/ui/charts";
import { useQuery } from "react-query";
import { getAllDeals } from "@/utils/api";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function FinanceWidget({ isLoading: externalLoading = false, dateRange, fullSize = false }) {
  // Fetch real deals data
  const { data: dealsData, isLoading: dealsLoading, error } = useQuery(
    'financeDeals',
    async () => {
      const result = await getAllDeals({ limit: 1000 });
      return result.deals || [];
    },
    {
      refetchOnWindowFocus: false,
      enabled: !externalLoading,
      staleTime: 5 * 60 * 1000,
    }
  );

  const isLoading = externalLoading || dealsLoading;

  // Calculate financial metrics from real data
  const financialData = useMemo(() => {
    if (!dealsData || dealsData.length === 0) {
      return {
        revenueData: [],
        profitData: [],
        salesData: [],
        totalRevenue: 0,
        totalProfit: 0,
        growth: 0,
        profitMargin: 0
      };
    }

    // Create monthly data for the last 12 months
    const monthlyData = {};
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM');
      
      monthlyData[monthKey] = {
        name: monthLabel,
        revenue: 0,
        profit: 0,
        sales: 0,
        deals: 0
      };
    }

    // Process deals data
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalSales = 0;

    dealsData.forEach(deal => {
      const dealDate = new Date(deal.startDate);
      const monthKey = format(dealDate, 'yyyy-MM');
      
      // Add to monthly totals if within our 12-month window
      if (monthlyData[monthKey]) {
        const revenue = deal.totalPaidToDate || 0;
        const profit = deal.profitLoss || 0;
        const sale = deal.salePrice || 0;
        
        monthlyData[monthKey].revenue += revenue;
        monthlyData[monthKey].profit += profit;
        monthlyData[monthKey].sales += sale;
        monthlyData[monthKey].deals += 1;
        
        totalRevenue += revenue;
        totalProfit += profit;
        totalSales += sale;
      }
    });

    // Convert to arrays for charts
    const revenueData = Object.values(monthlyData);
    const profitData = Object.values(monthlyData);
    const salesData = Object.values(monthlyData).map(item => ({
      name: item.name,
      value: item.sales,
      deals: item.deals
    }));

    // Calculate growth (compare last month to previous month)
    const lastMonth = revenueData[revenueData.length - 1]?.revenue || 0;
    const previousMonth = revenueData[revenueData.length - 2]?.revenue || 0;
    const growth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;

    // Calculate profit margin
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      revenueData: revenueData.map(item => ({
        name: item.name,
        value: item.revenue
      })),
      profitData: profitData.map(item => ({
        name: item.name,
        value: item.profit
      })),
      salesData,
      totalRevenue,
      totalProfit,
      growth,
      profitMargin
    };
  }, [dealsData]);

  return (
    <Card className={`${fullSize ? "col-span-full" : ""} overflow-hidden`}>
      <CardHeader>
        <CardTitle>Financial Performance</CardTitle>
        <CardDescription>
          Track revenue, profits, and sales performance over time
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        {error && (
          <div className="p-4 text-center text-red-500">
            Error loading financial data. Please try again later.
          </div>
        )}
        
        <Tabs defaultValue="revenue">
          <TabsList className="mx-4 mb-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>
          
          <div className="h-[400px] w-full flex flex-col">
            <TabsContent value="revenue" className="h-full mt-0 data-[state=active]:flex-1">
              {isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <div className="px-4 h-full">
                  <div className="h-[300px] w-full mb-4">
                    <LineChart 
                      data={financialData.revenueData} 
                      index="name"
                      categories={["value"]}
                      colors={["#3f4f24"]}
                      valueFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-[#f4f7ee] p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-[#3f4f24]">
                        ${financialData.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#f0f5f4] p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Growth</p>
                      <p className={`text-2xl font-bold ${financialData.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financialData.growth >= 0 ? '+' : ''}{financialData.growth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="profit" className="h-full mt-0 data-[state=active]:flex-1">
              {isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <div className="px-4 h-full">
                  <div className="h-[300px] w-full mb-4">
                    <BarChart 
                      data={financialData.profitData} 
                      index="name"
                      categories={["value"]}
                      colors={["#D4A017"]}
                      valueFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-[#fcf7e8] p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Profit</p>
                      <p className="text-2xl font-bold text-[#D4A017]">
                        ${financialData.totalProfit.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#f4f7ee] p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Profit Margin</p>
                      <p className="text-2xl font-bold text-[#3f4f24]">
                        {financialData.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sales" className="h-full mt-0 data-[state=active]:flex-1">
              {isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <div className="px-4 h-full">
                  <div className="h-[300px] w-full mb-4">
                    <BarChart 
                      data={financialData.salesData} 
                      index="name"
                      categories={["value"]}
                      colors={["#324c48"]}
                      valueFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-[#f0f5f4] p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Sales</p>
                      <p className="text-2xl font-bold text-[#324c48]">
                        ${(financialData.salesData.reduce((sum, item) => sum + item.value, 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#f4f7ee] p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Deals Closed</p>
                      <p className="text-2xl font-bold text-[#3f4f24]">
                        {financialData.salesData.reduce((sum, item) => sum + item.deals, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}