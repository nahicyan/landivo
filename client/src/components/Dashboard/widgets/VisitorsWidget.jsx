// client/src/components/Dashboard/widgets/VisitorsWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp,
  Construction,
  BarChart3,
  Clock,
  Users,
  MousePointer
} from "lucide-react";

export default function VisitorsWidget({ isLoading, dateRange }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Website Traffic</CardTitle>
        <CardDescription>
          Monitor visitor analytics and conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mx-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Construction className="h-8 w-8 text-blue-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Under Development
            </h3>
            
            <p className="text-center text-gray-600 mb-4 max-w-md">
              The visitor analytics module is currently being developed and will be available soon.
            </p>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <Clock className="h-4 w-4 mr-1" />
              <span>Expected completion: Q2 2025</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium">Visitor Tracking</span>
                <span className="text-xs text-gray-500 mt-1">Real-time analytics</span>
              </div>
              
              <div className="flex flex-col items-center">
                <BarChart3 className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium">Conversion Rates</span>
                <span className="text-xs text-gray-500 mt-1">Track performance</span>
              </div>
              
              <div className="flex flex-col items-center">
                <MousePointer className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium">Traffic Sources</span>
                <span className="text-xs text-gray-500 mt-1">Source attribution</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          className="w-full" 
          disabled
          variant="outline"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Coming Soon
        </Button>
      </CardFooter>
    </Card>
  );
}