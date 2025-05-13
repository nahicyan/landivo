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
  ChevronRight,
  HelpCircle
} from "lucide-react";

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
        { text: "Dashboard", icon: <Home className="h-5 w-5" />, path: "/admin" }
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
        { text: "Deals", icon: <DollarSign className="h-5 w-5" />, path: "/admin/deals" },
        { text: "Offers", icon: <DollarSign className="h-5 w-5" />, path: "/admin/offers" },
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
        {/* Sidebar - fixed width when collapsed */}
        <aside 
          className={cn(
            "h-[calc(100vh-80px)] border-r border-[#324c48]/20 bg-gradient-to-b from-[#fcfaf6] to-[#f1f6ea] shadow-lg transition-all duration-300 ease-in-out fixed z-10",
            collapsed ? "w-16" : "w-64" // Fixed widths for both states
          )}
          style={{ marginTop: "80px" }}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#324c48]/15 to-[#324c48]/5">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#324c48] to-[#546930] flex items-center justify-center shadow-md">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-[#324c48] tracking-tight">
                  Landivo
                </h2>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSidebarToggle}
              className={cn(
                "h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-[#324c48]/10 transition-all hover:shadow-lg",
                collapsed && "mx-auto"
              )}
            >
              {collapsed ? 
                <ChevronRight className="h-4 w-4 text-[#324c48]" /> : 
                <ChevronLeft className="h-4 w-4 text-[#324c48]" />
              }
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="py-4">
              {menuCategories.map((category, index) => (
                <div key={index} className="mb-4">
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
                        title={collapsed ? item.text : undefined}
                        className={cn(
                          "flex items-center py-2 px-3 text-sm font-medium transition-all duration-200 my-1 mx-2 rounded-lg",
                          isActive 
                            ? "bg-gradient-to-r from-[#546930]/25 to-[#546930]/15 text-[#324c48] shadow-sm" 
                            : "hover:bg-[#324c48]/10 text-[#324c48]/80"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center rounded-lg transition-all",
                          collapsed ? "h-8 w-8 mx-auto" : "h-7 w-7 mr-3",
                          isActive
                            ? "bg-gradient-to-br from-[#546930] to-[#324c48] text-white shadow-sm"
                            : "bg-[#324c48]/10 text-[#324c48]"
                        )}>
                          {item.icon}
                        </div>
                        
                        {!collapsed && (
                          <span className={cn(
                            "transition-all",
                            isActive ? "font-bold" : ""
                          )}>
                            {item.text}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  
                  {!collapsed && index < menuCategories.length - 1 && (
                    <Separator className="my-4 mx-4 opacity-30" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Area - with left margin to account for fixed sidebar */}
        <main className={cn(
          "flex-grow bg-gradient-to-b from-white to-[#f4f7ee]/50 min-h-[calc(100vh-160px)] transition-all duration-300",
          collapsed ? "ml-16 p-6" : "ml-64 p-8"
        )}>
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