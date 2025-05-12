// client/src/components/Dashboard/widgets/EmailReportWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail,
  Construction,
  Wrench,
  Clock
} from "lucide-react";

export default function EmailReportWidget({ isLoading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Marketing</CardTitle>
        <CardDescription>
          Email campaign performance and analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Construction className="h-8 w-8 text-orange-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Under Development
            </h3>
            
            <p className="text-center text-gray-600 mb-4 max-w-md">
              The email marketing module is currently being developed and will be available soon.
            </p>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <Clock className="h-4 w-4 mr-1" />
              <span>Expected completion: Q2 2025</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Mail className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium">Campaign Builder</span>
                <span className="text-xs text-gray-500 mt-1">Create and send emails</span>
              </div>
              
              <div className="flex flex-col items-center">
                <Wrench className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium">Analytics</span>
                <span className="text-xs text-gray-500 mt-1">Track performance</span>
              </div>
              
              <div className="flex flex-col items-center">
                <Mail className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium">Automation</span>
                <span className="text-xs text-gray-500 mt-1">Automated workflows</span>
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
          <Mail className="mr-2 h-4 w-4" />
          Coming Soon
        </Button>
      </CardFooter>
    </Card>
  );
}