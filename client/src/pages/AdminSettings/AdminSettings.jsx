import React from "react";
import { toast } from "react-toastify";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  MailIcon, 
  KeyIcon, 
  ShieldIcon, 
  BotIcon,
  SettingsIcon,
  MapPinIcon,
  LineChartIcon,
  WrenchIcon,
} from "lucide-react";

// Import modular components
import SystemEmailSettings from "./SystemEmailSettings";
import MarketingEmail from "./MarketingEmail";
import SystemSettings from "./SystemSettings";
import Auth0Settings from "./Auth0Settings";
import AISettings from "./AISettings";
import RocketChatBot from "./RocketChatBot";
import GoogleAPI from "./GoogleAPI";
import GoogleAnalytics from "./GoogleAnalytics";
import ServerOperations from "./ServerOperations";
import DatabaseOperations from "./DatabaseOperations";

export default function AdminSettings() {
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
              <SystemEmailSettings />
            </TabsContent>
            
            <TabsContent value="marketing-email">
              <MarketingEmail />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <SystemSettings />
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
              <Auth0Settings />
            </TabsContent>
            
            <TabsContent value="ai">
              <AISettings />
            </TabsContent>
            
            <TabsContent value="rocket">
              <RocketChatBot />
            </TabsContent>
            
            <TabsContent value="google-api">
              <GoogleAPI />
            </TabsContent>
            
            <TabsContent value="analytics">
              <GoogleAnalytics />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServerOperations />
            <DatabaseOperations />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}