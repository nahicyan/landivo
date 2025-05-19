// Updated client/src/pages/AdminSettings/AdminSettings.jsx
// This replaces the Finance tab with System tab and adds phone override setting

import React, { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { 
  MailIcon, 
  ServerIcon, 
  KeyIcon, 
  ShieldIcon, 
  DatabaseIcon, 
  RefreshCwIcon,
  BotIcon,
  SettingsIcon,
  GaugeIcon,
  MapPinIcon,
  LineChartIcon,
  WrenchIcon,
  PhoneIcon
} from "lucide-react";
import { toast } from "react-toastify";
import { getSystemSettings, updateSystemSettings } from "@/utils/api";

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Email settings form
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

  // Auth0 settings form
  const auth0Form = useForm({
    defaultValues: {
      domain: "",
      clientId: "",
      audience: ""
    }
  });

  // Maintenance form
  const maintenanceForm = useForm({
    defaultValues: {
      backupLocation: "/var/backups/mongodb"
    }
  });

  // System settings form
  const systemForm = useForm({
    defaultValues: {
      overrideContactPhone: ""
    }
  });

  // Load system settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSystemSettings();
        if (settings) {
          systemForm.reset({
            overrideContactPhone: settings.overrideContactPhone || ""
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const onEmailSubmit = (data) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Email settings updated:", data);
      toast.success("Email settings updated successfully");
      setIsLoading(false);
    }, 1500);
  };

  const onAuth0Submit = (data) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Auth0 settings updated:", data);
      toast.success("Auth0 settings updated successfully");
      setIsLoading(false);
    }, 1500);
  };

  const onSystemSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      await updateSystemSettings(data);
      toast.success("System settings updated successfully");
    } catch (error) {
      console.error("Error updating system settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerAction = (action) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Server action executed:", action);
      toast.success(`Server ${action} completed successfully`);
      setIsLoading(false);
    }, 2000);
  };

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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#3f4f24]">System Settings</h1>
          <p className="text-[#324c48]/80 mt-1">
            Configure system-wide settings and integrations
          </p>
        </div>
        <Button 
          className="bg-[#D4A017] hover:bg-[#D4A017]/90"
          onClick={() => toast.info("Settings documentation opened")}
        >
          Documentation
        </Button>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="mb-6 bg-[#f4f7ee]">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <MailIcon className="w-4 h-4" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <WrenchIcon className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <KeyIcon className="w-4 h-4" />
            API & Integration
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Tabs defaultValue="system-email" className="w-full">
            <TabsList className="mb-6 bg-[#f4f7ee]">
              <TabsTrigger value="system-email">
                System Email Settings
              </TabsTrigger>
              <TabsTrigger value="marketing-email">
                Marketing Email
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="system-email">
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
            </TabsContent>
            
            <TabsContent value="marketing-email">
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
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* System Tab (replacing Finance) */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <WrenchIcon className="w-6 h-6 text-[#D4A017]" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure global system settings and display options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                  {/* Contact Settings Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[#324c48]">Contact Display Settings</h3>
                    <FormField
                      control={systemForm.control}
                      name="overrideContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-[#D4A017]" />
                            Override Contact Profile Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(555) 123-4567" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            If set, this phone number will be displayed for all contact profiles
                            instead of their individual numbers. Leave empty to use individual profile numbers.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <Button 
                      type="submit" 
                      className="bg-[#3f4f24] hover:bg-[#3f4f24]/90"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save System Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API & Integration Tab */}
        <TabsContent value="api">
          <Tabs defaultValue="auth0" className="w-full">
            <TabsList className="mb-6 bg-[#f4f7ee]">
              <TabsTrigger value="auth0" className="flex items-center gap-2">
                <ShieldIcon className="w-4 h-4" />
                Auth0 Settings
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <BotIcon className="w-4 h-4" />
                AI
              </TabsTrigger>
              <TabsTrigger value="rocket" className="flex items-center gap-2">
                <BotIcon className="w-4 h-4" />
                RocketChat Bot
              </TabsTrigger>
              <TabsTrigger value="google-api" className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" />
                Google API
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4" />
                Google Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="auth0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldIcon className="w-5 h-5 text-[#D4A017]" />
                    Auth0 Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure Auth0 authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...auth0Form}>
                    <form onSubmit={auth0Form.handleSubmit(onAuth0Submit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={auth0Form.control}
                          name="domain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Auth0 Domain</FormLabel>
                              <FormControl>
                                <Input placeholder="yourdomain.us.auth0.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your Auth0 application domain
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={auth0Form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client ID</FormLabel>
                              <FormControl>
                                <Input placeholder="your-client-id" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your Auth0 application client ID
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={auth0Form.control}
                          name="audience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Audience</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourdomain.com/api" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your Auth0 API identifier
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Enable Role-Based Access
                            </FormLabel>
                            <FormDescription>
                              Sync Auth0 roles with application permissions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={true} />
                          </FormControl>
                        </FormItem>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => auth0Form.reset()}>
                          Reset
                        </Button>
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
            </TabsContent>
            
            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI Settings</CardTitle>
                  <CardDescription>Configure AI integration settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>AI integration configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rocket">
              <Card>
                <CardHeader>
                  <CardTitle>RocketChat Notification Bot</CardTitle>
                  <CardDescription>Configure RocketChat bot settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>RocketChat bot configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="google-api">
              <Card>
                <CardHeader>
                  <CardTitle>Google API Settings</CardTitle>
                  <CardDescription>Configure Google Maps and other Google API settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Google API configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Google Analytics Settings</CardTitle>
                  <CardDescription>Configure Google Analytics tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Google Analytics configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <FormField
                    control={maintenanceForm.control}
                    name="backupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Directory path for database backups
                        </FormDescription>
                      </FormItem>
                    )}
                  />

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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}