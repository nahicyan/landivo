import React, { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, ServerIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLogger } from "@/utils/logger";

const log = getLogger("ServerOperations");

export default function ServerOperations() {
  const [isLoading, setIsLoading] = useState(false);

  const handleServerAction = (action) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      log.info(
        `[ServerOperations:handleServerAction] > [Action]: ${action}`
      );
      toast.success(`Server ${action} completed successfully`);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="w-5 h-5 text-[#D4A017]" />
          Server Operations
        </CardTitle>
        <CardDescription>
          Manage server services and operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card className="border border-[#3f4f24]/20">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Web Server</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2"
                    onClick={() => handleServerAction("nginx-restart")}
                    disabled={isLoading}
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                    Restart Web Server
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2 text-amber-600 hover:text-amber-700"
                    onClick={() => handleServerAction("nginx-stop")}
                    disabled={isLoading}
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                    Stop Web Server
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#3f4f24]/20">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Backend Server</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2"
                    onClick={() => handleServerAction("backend-start")}
                    disabled={isLoading}
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                    Start Backend Server
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2"
                    onClick={() => handleServerAction("backend-restart")}
                    disabled={isLoading}
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                    Restart Backend Server
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2 text-amber-600 hover:text-amber-700"
                    onClick={() => handleServerAction("backend-stop")}
                    disabled={isLoading}
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                    Stop Backend Server
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
