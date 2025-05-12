// client/src/components/Dashboard/widgets/QualificationsWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  ArrowRight,
  BarChart,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/utils/format";
import { useQuery } from "react-query";
import { getAllQualifications } from "@/utils/api";

export default function QualificationsWidget({ isLoading: externalLoading = false }) {
  const navigate = useNavigate();

  // Fetch real qualifications from API
  const { data: qualificationData, isLoading: apiLoading, error } = useQuery(
    'dashboardQualifications',
    async () => {
      // Fetch recent qualifications (limit to 10 for performance)
      const response = await getAllQualifications(1, 10);
      
      // Sort by date (newest first)
      const sortedQualifications = response.qualifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      return {
        qualifications: sortedQualifications,
        totalCount: response.pagination.totalCount,
        qualified: response.qualifications.filter(q => q.qualified).length,
        notQualified: response.qualifications.filter(q => !q.qualified).length
      };
    },
    {
      refetchOnWindowFocus: false,
      enabled: !externalLoading,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Combine external loading state with API loading state
  const isLoading = externalLoading || apiLoading;

  // Calculate qualification metrics from real data
  const calculateStats = () => {
    if (!qualificationData) {
      return {
        total: 0,
        qualified: 0,
        notQualified: 0,
        qualificationRate: 0,
        averageLoanAmount: 0
      };
    }

    const total = qualificationData.totalCount;
    const qualified = qualificationData.qualified;
    const notQualified = qualificationData.notQualified;
    const qualificationRate = total > 0 ? Math.round((qualified / total) * 100) : 0;
    
    // Calculate average loan amount from qualified applications
    const qualifiedWithLoans = qualificationData.qualifications
      .filter(q => q.qualified && q.loanAmount);
    const averageLoanAmount = qualifiedWithLoans.length > 0
      ? qualifiedWithLoans.reduce((sum, q) => sum + q.loanAmount, 0) / qualifiedWithLoans.length
      : 0;

    return {
      total,
      qualified,
      notQualified,
      qualificationRate,
      averageLoanAmount
    };
  };

  const stats = calculateStats();

  // Get recent qualifications (first 5)
  const recentQualifications = qualificationData ? qualificationData.qualifications.slice(0, 5) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financing Applications</CardTitle>
        <CardDescription>
          Recent qualification applications and approval status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Error loading qualifications. Please try again later.
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Qualification rate: {stats.qualificationRate}%</span>
                <span>{stats.qualified} of {stats.total} qualified</span>
              </div>
              <Progress 
                value={stats.qualificationRate} 
                className="h-2"
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-[#f4f7ee] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Average Loan</p>
                  <p className="text-xl font-bold text-[#3f4f24]">${formatPrice(stats.averageLoanAmount)}</p>
                </div>
                <div className="bg-[#fcf7e8] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Applications</p>
                  <p className="text-xl font-bold text-[#D4A017]">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[200px]">
              <div className="space-y-4">
                {recentQualifications.length > 0 ? (
                  recentQualifications.map((qual) => (
                    <div 
                      key={qual.id}
                      className="flex items-start gap-3 p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarFallback className="bg-[#324c48] text-white">
                          {qual.firstName?.charAt(0) || ''}
                          {qual.lastName?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium">{qual.firstName} {qual.lastName}</p>
                          <Badge className={`ml-2 ${qual.qualified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {qual.qualified ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Qualified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Qualified
                              </span>
                            )}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Applied for: {qual.propertyAddress || 'Property not specified'}
                        </p>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Property price: ${formatPrice(qual.propertyPrice)}
                        </div>
                        {qual.qualified && (
                          <div className="text-xs text-green-600 mt-1">
                            Loan: ${formatPrice(qual.loanAmount)} | Payment: ${formatPrice(qual.monthlyPayment)}/mo
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-right text-gray-500">
                        {format(new Date(qual.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No recent applications found.
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button 
          variant="outline"
          onClick={() => navigate("/admin/financing")}
        >
          <FileText className="mr-2 h-4 w-4" />
          View Applications
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate("/admin/financing")}
        >
          <BarChart className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </CardFooter>
    </Card>
  );
}