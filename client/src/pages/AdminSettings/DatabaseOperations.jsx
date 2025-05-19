import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormControl, FormDescription, FormItem, FormLabel } from "@/components/ui/form";
import { DatabaseIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatabaseOperations() {
  const [isLoading, setIsLoading] = useState(false);
  
  const maintenanceForm = useForm({
    defaultValues: {
      backupLocation: "/var/backups/mongodb"
    }
  });

  const handleBackup = (type) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Backup executed:", type);
      toast.success(`Database backup (${type}) completed successfully`);
      setIsLoading(false);
    }, 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5 text-[#D4A017]" />
          Database Operations
        </CardTitle>
        <CardDescription>
          Backup and restore MongoDB database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <FormItem>
            <FormLabel>Backup Location</FormLabel>
            <FormControl>
              <Input 
                {...maintenanceForm.register("backupLocation")} 
                defaultValue="/var/backups/mongodb"
              />
            </FormControl>
            <FormDescription>
              Directory path for database backups
            </FormDescription>
          </FormItem>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Backup Operations</h3>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => handleBackup("local")}
                disabled={isLoading}
              >
                <DatabaseIcon className="w-4 h-4" />
                Backup MongoDB (Local)
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => handleBackup("download")}
                disabled={isLoading}
              >
                <DatabaseIcon className="w-4 h-4" />
                Backup MongoDB (Download)
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => handleBackup("online")}
                disabled={isLoading}
              >
                <DatabaseIcon className="w-4 h-4" />
                Backup MongoDB (Online)
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Restore Operations</h3>
            <Button 
              variant="outline" 
              className="justify-start gap-2 w-full text-amber-600 hover:text-amber-700"
              onClick={() => toast.info("Please select a backup file to restore")}
            >
              <DatabaseIcon className="w-4 h-4" />
              Restore MongoDB Database
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}