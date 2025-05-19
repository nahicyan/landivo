import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketingEmail() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Marketing Email Settings</CardTitle>
        <CardDescription>
          Marketing email integration is currently under construction
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 p-6 rounded-lg border border-yellow-300 inline-block">
            <p className="text-yellow-700 font-medium">
              This feature is coming soon!
            </p>
            <p className="text-yellow-600 mt-2">
              Marketing email configuration will be available in the next update.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}