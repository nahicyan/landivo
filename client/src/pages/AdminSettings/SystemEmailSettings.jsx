// client/src/pages/AdminSettings/SystemEmailSettings.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuth0 } from "@auth0/auth0-react";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ServerIcon, 
  MailIcon, 
  PlusCircleIcon, 
  XCircleIcon 
} from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSystemSettings, updateSystemSettings, testSmtpConnection } from "@/utils/api";

export default function SystemEmailSettings() {
  const { user } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  
  // State for email arrays
  const [offerEmails, setOfferEmails] = useState([]);
  const [financingEmails, setFinancingEmails] = useState([]);
  const [newOfferEmail, setNewOfferEmail] = useState("");
  const [newFinancingEmail, setNewFinancingEmail] = useState("");
  
  const emailForm = useForm({
    defaultValues: {
      smtpServer: "",
      smtpPort: "",
      smtpUser: "",
      smtpPassword: "",
      enableOfferEmails: false,
      enableFinancingEmails: false
    }
  });

  // Load system settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSystemSettings();
        if (settings) {
          emailForm.reset({
            smtpServer: settings.smtpServer || "",
            smtpPort: settings.smtpPort || "",
            smtpUser: settings.smtpUser || "",
            smtpPassword: "", // Don't load password for security reasons
            enableOfferEmails: settings.enableOfferEmails || false,
            enableFinancingEmails: settings.enableFinancingEmails || false
          });
          setOfferEmails(settings.offerEmailRecipients || []);
          setFinancingEmails(settings.financingEmailRecipients || []);
        }
      } catch (error) {
        console.error("Error loading system email settings:", error);
        toast.error("Failed to load email settings");
      }
    };

    loadSettings();
  }, []);

  // Set user email when Auth0 user is loaded
  useEffect(() => {
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [user]);

  // Email validation
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add email to list
  const addEmail = (type, email) => {
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (type === "offer") {
      if (offerEmails.includes(email)) {
        toast.warning("This email is already in the list");
        return;
      }
      setOfferEmails([...offerEmails, email]);
      setNewOfferEmail("");
    } else {
      if (financingEmails.includes(email)) {
        toast.warning("This email is already in the list");
        return;
      }
      setFinancingEmails([...financingEmails, email]);
      setNewFinancingEmail("");
    }
  };

  // Remove email from list
  const removeEmail = (type, email) => {
    if (type === "offer") {
      setOfferEmails(offerEmails.filter(e => e !== email));
    } else {
      setFinancingEmails(financingEmails.filter(e => e !== email));
    }
  };

  // Open test email dialog
  const openTestEmailDialog = () => {
    setTestEmailDialogOpen(true);
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!validateEmail(testEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setTestingConnection(true);
    setTestEmailDialogOpen(false);
    
    try {
      const { smtpServer, smtpPort, smtpUser, smtpPassword } = emailForm.getValues();
      
      const response = await testSmtpConnection({
        testRecipient: testEmail,
        smtpServer,
        smtpPort,
        smtpUser,
        smtpPassword
      });
      
      toast.success(response.message || "Test email sent successfully");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send test email";
      toast.error(errorMessage);
      console.error("Error sending test email:", error);
    } finally {
      setTestingConnection(false);
    }
  };

  const onEmailSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Include email arrays in the data
      const finalData = {
        ...data,
        offerEmailRecipients: offerEmails,
        financingEmailRecipients: financingEmails
      };
      
      // Clear password field if it's empty (unchanged)
      if (!finalData.smtpPassword) {
        delete finalData.smtpPassword;
      }
      
      await updateSystemSettings(finalData);
      toast.success("Email settings updated successfully");
    } catch (error) {
      console.error("Error updating email settings:", error);
      toast.error("Failed to update email settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
              {/* SMTP Configuration Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SMTP Configuration</h3>
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
                          <Input 
                            type="password" 
                            placeholder={field.value ? "••••••••" : "Enter password"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value ? "Password will be updated" : "Leave blank to keep existing password"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="gap-2"
                  onClick={openTestEmailDialog}
                  disabled={testingConnection}
                >
                  <MailIcon className="w-4 h-4" />
                  {testingConnection ? "Sending..." : "Test SMTP Connection"}
                </Button>
              </div>
              
              {/* Offer Email Notifications */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-[#D4A017]" />
                      Offer Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Configure notifications for new property offers
                    </p>
                  </div>
                  <FormField
                    control={emailForm.control}
                    name="enableOfferEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {emailForm.watch("enableOfferEmails") && (
                  <div className="ml-4 border-l-2 pl-4 border-l-[#D4A017]/30">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Offer Notification Recipients</label>
                        <div className="flex flex-wrap gap-2 my-2">
                          {offerEmails.map(email => (
                            <Badge key={email} variant="secondary" className="gap-1 py-1">
                              {email}
                              <XCircleIcon 
                                className="w-4 h-4 cursor-pointer text-red-500 hover:text-red-700"
                                onClick={() => removeEmail("offer", email)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex mt-2">
                          <Input
                            placeholder="Add email address"
                            value={newOfferEmail}
                            onChange={(e) => setNewOfferEmail(e.target.value)}
                            className="rounded-r-none"
                          />
                          <Button 
                            type="button"
                            variant="secondary"
                            className="rounded-l-none"
                            onClick={() => addEmail("offer", newOfferEmail)}
                          >
                            <PlusCircleIcon className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Add email addresses that should receive offer notifications
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Financing Email Notifications */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-[#D4A017]" />
                      Financing Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Configure notifications for property financing applications
                    </p>
                  </div>
                  <FormField
                    control={emailForm.control}
                    name="enableFinancingEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {emailForm.watch("enableFinancingEmails") && (
                  <div className="ml-4 border-l-2 pl-4 border-l-[#D4A017]/30">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Financing Notification Recipients</label>
                        <div className="flex flex-wrap gap-2 my-2">
                          {financingEmails.map(email => (
                            <Badge key={email} variant="secondary" className="gap-1 py-1">
                              {email}
                              <XCircleIcon 
                                className="w-4 h-4 cursor-pointer text-red-500 hover:text-red-700"
                                onClick={() => removeEmail("financing", email)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex mt-2">
                          <Input
                            placeholder="Add email address"
                            value={newFinancingEmail}
                            onChange={(e) => setNewFinancingEmail(e.target.value)}
                            className="rounded-r-none"
                          />
                          <Button 
                            type="button"
                            variant="secondary"
                            className="rounded-l-none"
                            onClick={() => addEmail("financing", newFinancingEmail)}
                          >
                            <PlusCircleIcon className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Add email addresses that should receive financing application notifications
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => emailForm.reset()}>
                    Reset
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#3f4f24] hover:bg-[#3f4f24]/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Email Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Test Email Dialog - Fixed version without Form components */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify SMTP configuration. Current server settings will be used.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input 
                id="test-email"
                placeholder="your@email.com" 
                value={testEmail} 
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                The test email will be sent to this address
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#3f4f24] hover:bg-[#3f4f24]/90"
              onClick={sendTestEmail}
              disabled={!validateEmail(testEmail)}
            >
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
