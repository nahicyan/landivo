import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, ServerIcon } from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";

export default function SystemEmailSettings() {
  const [isLoading, setIsLoading] = useState(false);
  
  const emailForm = useForm({
    defaultValues: {
      smtpServer: "",
      smtpPort: "",
      smtpUser: "",
      smtpPassword: "",
      adminEmail: "",
      additionalEmail: ""
    }
  });

  const onEmailSubmit = (data) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Email settings updated:", data);
      toast.success("Email settings updated successfully");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="w-5 h-5 text-[#D4A017]" />
          System Email Configuration
        </CardTitle>
        <CardDescription>
          Configure the system email settings for notifications and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={emailForm.control}
                name="smtpServer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Server</FormLabel>
                    <FormControl>
                      <Input placeholder="mail.yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      The address of your SMTP server
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Port</FormLabel>
                    <FormControl>
                      <Input placeholder="587" {...field} />
                    </FormControl>
                    <FormDescription>
                      Port number (usually 587 for TLS or 465 for SSL)
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="smtpUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Email (SMTP User)</FormLabel>
                    <FormControl>
                      <Input placeholder="noreply@yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Email address used to send system emails
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="smtpPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password for the SMTP account
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Email address for receiving notifications
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="additionalEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notifier Email</FormLabel>
                    <FormControl>
                      <Input placeholder="team@yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Additional email for notifications (optional)
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => emailForm.reset()}>
                  Reset
                </Button>
                <Button type="button" variant="outline" className="gap-2">
                  <RefreshCwIcon className="w-4 h-4" />
                  Test Connection
                </Button>
              </div>
              <Button 
                type="submit" 
                className="bg-[#3f4f24] hover:bg-[#3f4f24]/90"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}