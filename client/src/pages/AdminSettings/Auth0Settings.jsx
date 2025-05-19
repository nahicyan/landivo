import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldIcon } from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";

export default function Auth0Settings() {
  const [isLoading, setIsLoading] = useState(false);
  
  const auth0Form = useForm({
    defaultValues: {
      domain: "",
      clientId: "",
      audience: ""
    }
  });

  const onAuth0Submit = (data) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Auth0 settings updated:", data);
      toast.success("Auth0 settings updated successfully");
      setIsLoading(false);
    }, 1500);
  };

  return (
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
  );
}