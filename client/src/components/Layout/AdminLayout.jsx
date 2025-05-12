// client/src/components/Layout/AdminLayout.jsx
import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft,
  Home,
  Building,
  Users,
  User,
  BarChart,
  ListChecks,
  DollarSign,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  HelpCircle
} from "lucide-react";

const sidebarWidth = 300;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setCollapsed(!collapsed);
  };

  // Admin navigation items with category grouping
  const menuCategories = [
    {
      name: "Overview",
      items: [
        { text: "Dashboard", icon: <Home className="h-5 w-5" />, path: "/admin", badge: 3 }
      ]
    },
    {
      name: "Management",
      items: [
        { text: "Properties", icon: <Building className="h-5 w-5" />, path: "/admin/properties" },
        { text: "Users", icon: <Users className="h-5 w-5" />, path: "/admin/users" },
        { text: "Buyers", icon: <User className="h-5 w-5" />, path: "/admin/buyers" },
      ]
    },
    {
      name: "Transactions",
      items: [
        { text: "Deals", icon: <DollarSign className="h-5 w-5" />, path: "/admin/deals", badge: 2 },
        { text: "Offers", icon: <DollarSign className="h-5 w-5" />, path: "/admin/offers", badge: 5 },
      ]
    },
    {
      name: "Communications",
      items: [
        { text: "Email Lists", icon: <ListChecks className="h-5 w-5" />, path: "/admin/buyer-lists" },
      ]
    },
    {
      name: "Applications",
      items: [
        { text: "Financing", icon: <BarChart className="h-5 w-5" />, path: "/admin/financing" },
      ]
    },
    {
      name: "System",
      items: [
        { text: "Settings", icon: <Settings className="h-5 w-5" />, path: "/admin/settings" },
        { text: "Help", icon: <HelpCircle className="h-5 w-5" />, path: "/admin/help" },
      ]
    },
  ];

  return (
    <div className="bg-[#FDF8F2] text-[#333] min-h-screen flex flex-col">
      {/* Header section */}
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#FDF8F2] to-[#f4f7ee] shadow-sm border-b border-[#324c48]/10">
        <Header />
      </header>

      <div className="flex flex-grow">
        {/* Premium Admin Sidebar */}
        <aside 
          className={cn(
            "h-[calc(100vh-80px)] border-r border-[#324c48]/20 bg-gradient-to-b from-[#fcfaf6] to-[#f1f6ea] shadow-lg transition-all duration-300 ease-in-out relative",
            collapsed ? "w-20" : `w-[${sidebarWidth}px]`
          )}
          style={{ marginTop: "80px" }}
        >
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#324c48]/15 to-[#324c48]/5">
            <div className={cn(
              "flex items-center space-x-3 transition-opacity duration-300",
              collapsed ? "opacity-0" : "opacity-100"
            )}>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#324c48] to-[#546930] flex items-center justify-center shadow-md">
                <Building className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-bold text-xl text-[#324c48] tracking-tight">
                Landivo
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSidebarToggle}
              className="h-10 w-10 rounded-full bg-white/80 shadow-md hover:bg-[#324c48]/10 transition-all hover:shadow-lg"
            >
              {collapsed ? 
                <ChevronRight className="h-5 w-5 text-[#324c48]" /> : 
                <ChevronLeft className="h-5 w-5 text-[#324c48]" />
              }
            </Button>
          </div>
          
          <div className={cn(
            "flex items-center justify-between px-6 py-4",
            collapsed && "justify-center"
          )}>
            <div className={cn(
              "flex items-center space-x-3",
              collapsed && "hidden"
            )}>
              <div className="h-10 w-10 rounded-full bg-[#546930]/15 flex items-center justify-center">
                <User className="h-5 w-5 text-[#546930]" />
              </div>
              <div>
                <p className="font-semibold text-[#324c48]">Admin User</p>
                <p className="text-xs text-[#324c48]/70">Administrator</p>
              </div>
            </div>
            
            <Button
              variant="ghost" 
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full bg-[#D4A017]/15 hover:bg-[#D4A017]/25 transition-all",
                !collapsed && "relative"
              )}
            >
              <Bell className="h-5 w-5 text-[#D4A017]" />
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-240px)] px-4">
            <div className="py-4 space-y-6">
              {menuCategories.map((category, index) => (
                <div key={index} className="space-y-1">
                  {!collapsed && (
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#324c48]/60 ml-4 mb-2">
                      {category.name}
                    </h3>
                  )}
                  
                  {category.items.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== '/admin' && location.pathname.startsWith(item.path));
                    
                    return (
                      <Link 
                        key={item.text}
                        to={item.path}
                        className={cn(
                          "group flex items-center py-3 px-4 text-md font-medium rounded-xl transition-all duration-200",
                          isActive 
                            ? "bg-gradient-to-r from-[#546930]/25 to-[#546930]/15 text-[#324c48] shadow-md" 
                            : "hover:bg-[#324c48]/10 text-[#324c48]/80 hover:shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-all mr-3",
                          isActive
                            ? "bg-gradient-to-br from-[#546930] to-[#324c48] text-white shadow-md"
                            : "bg-[#324c48]/10 text-[#324c48] group-hover:bg-[#324c48]/20"
                        )}>
                          {item.icon}
                        </div>
                        
                        <span className={cn(
                          "transition-all flex-1",
                          collapsed ? "opacity-0 w-0" : "opacity-100",
                          isActive ? "font-bold" : ""
                        )}>
                          {item.text}
                        </span>
                        
                        {item.badge && !collapsed && (
                          <span className="h-6 min-w-6 rounded-full bg-[#D4A017] px-1.5 flex items-center justify-center text-xs font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  
                  {!collapsed && index < menuCategories.length - 1 && (
                    <Separator className="my-4 opacity-30" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {!collapsed && (
            <div className="absolute bottom-0 w-full p-4 border-t border-[#324c48]/10 bg-gradient-to-t from-[#f1f6ea] to-transparent">
              <Button
                variant="ghost"
                className="w-full text-[#324c48]/80 hover:text-[#324c48] hover:bg-[#324c48]/10 py-3 rounded-xl flex items-center justify-start pl-4"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Log Out</span>
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow bg-gradient-to-b from-white to-[#f4f7ee]/50 p-8 min-h-[calc(100vh-160px)] shadow-inner">
          <div className="bg-white rounded-xl shadow-sm p-6 min-h-[calc(100vh-220px)] border border-[#324c48]/5">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer section */}
      <footer className="bg-gradient-to-r from-[#EFE8DE] to-[#f4f7ee] shadow-inner border-t border-[#324c48]/10">
        <Footer />
      </footer>
    </div>
  );
}