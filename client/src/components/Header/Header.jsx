// client/src/components/Header/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink, NavigationMenuContent, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Home,
  MapPin,
  DollarSign,
  FileText,
  Users,
  HelpCircle,
  Building2,
  UserPlus,
  Plus,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import { usePermissions } from "@/components/Auth0/PermissionsContext";
import PermissionGuard from "@/components/Auth0/PermissionGuard";
import { PERMISSIONS } from "@/utils/permissions";
import { useVipBuyer } from "@/utils/VipBuyerContext";
import { useUserProfileApi } from "@/utils/api";

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [propertiesExpanded, setPropertiesExpanded] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  // Use the enhanced Auth hook and permissions
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth();

  // Also access VIP buyer data
  const { isVipBuyer, vipBuyerData } = useVipBuyer();

  // Use the same hook that the Profile page uses
  const { getUserProfile } = useUserProfileApi();

  const { check } = usePermissions();

  // Load database user profile data using the proper authenticated method
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const profile = await getUserProfile();
          console.log("Loaded user profile in Header:", profile);
          setDbUser(profile);
        } catch (error) {
          console.error("Error loading user profile in Header:", error);
        }
      }
    };

    loadUserProfile();
  }, [isAuthenticated, isLoading, getUserProfile]);

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  // Get display name with priority to database information
  const getDisplayName = () => {
    if (dbUser?.firstName && dbUser?.lastName) {
      return `${dbUser.firstName} ${dbUser.lastName}`;
    }
    if (isVipBuyer && vipBuyerData?.firstName && vipBuyerData?.lastName) {
      return `${vipBuyerData.firstName} ${vipBuyerData.lastName}`;
    }
    if (dbUser?.firstName) {
      return dbUser.firstName;
    }
    if (isVipBuyer && vipBuyerData?.firstName) {
      return vipBuyerData.firstName;
    }
    if (user?.given_name && user?.family_name) {
      return `${user.given_name} ${user.family_name}`;
    }
    if (user?.name && !user.name.includes("@")) {
      return user.name;
    }
    return user?.email || "User";
  };

  // Area navigation items for dropdown
  const areaItems = [
    { name: "All Properties", path: "/properties", icon: Building2 },
    { name: "Dallas Fort Worth", path: "/DFW", icon: MapPin },
    { name: "Austin", path: "/Austin", icon: MapPin },
    { name: "Houston", path: "/Houston", icon: MapPin },
    { name: "San Antonio", path: "/SanAntonio", icon: MapPin },
    { name: "Other Areas", path: "/OtherLands", icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#e3a04f] shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" title="Landivo">
              <img className="w-auto h-10 lg:h-12" src="https://cdn.landivo.com/wp-content/uploads/2025/04/logo.svg" alt="Logo" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-[#3f4f24]/10">
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-[#324c48]" />
                  ) : (
                    <Menu className="w-6 h-6 text-[#324c48]" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[85vw] max-w-sm bg-[#FDF8F2] border-r border-[#e3a04f]/30 p-0 overflow-y-auto"
              >
                {/* User Profile Section */}
                {isAuthenticated && (
                  <div className="bg-gradient-to-br from-[#3f4f24] to-[#324c48] px-6 py-6 mb-2">
                    <div className="flex items-center space-x-3">
                      {user?.picture ? (
                        <img 
                          src={user.picture} 
                          alt={getDisplayName()} 
                          className="w-14 h-14 rounded-full border-2 border-[#D4A017]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#D4A017]/20 flex items-center justify-center border-2 border-[#D4A017]">
                          <User className="w-7 h-7 text-[#D4A017]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white truncate">
                          {getDisplayName()}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-white/70 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items Container */}
                <div className="px-3 py-2">
                  {/* Home Link */}
                  <Link 
                    to="/" 
                    className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                    <span className="text-base font-medium">Home</span>
                  </Link>

                  {/* Separator */}
                  <div className="h-px bg-[#e3a04f]/20 my-2 mx-4"></div>

                  {/* Properties Section with Expandable Submenu */}
                  <div>
                    <button
                      onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                      className="flex items-center justify-between w-full px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                        <span className="text-base font-medium">Properties</span>
                      </div>
                      <ChevronRight 
                        className={`w-4 h-4 text-[#324c48] transition-transform ${propertiesExpanded ? 'rotate-90' : ''}`} 
                      />
                    </button>
                    
                    {/* Submenu */}
                    {propertiesExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {areaItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="flex items-center px-4 py-2.5 text-[#324c48]/90 hover:bg-[#3f4f24]/5 rounded-lg transition-colors text-sm"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon className="w-4 h-4 mr-2.5 text-[#3f4f24]/60" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-[#e3a04f]/20 my-2 mx-4"></div>

                  {/* Sell */}
                  <Link 
                    to="/sell" 
                    className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <DollarSign className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                    <span className="text-base font-medium">Sell</span>
                  </Link>

                  {/* Separator */}
                  <div className="h-px bg-[#e3a04f]/20 my-2 mx-4"></div>

                  {/* Financing */}
                  <Link 
                    to="/financing" 
                    className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                    <span className="text-base font-medium">Financing</span>
                  </Link>

                  {/* Separator */}
                  <div className="h-px bg-[#e3a04f]/20 my-2 mx-4"></div>

                  {/* About Us */}
                  <Link 
                    to="/about-us" 
                    className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                    <span className="text-base font-medium">About Us</span>
                  </Link>

                  {/* Separator */}
                  <div className="h-px bg-[#e3a04f]/20 my-2 mx-4"></div>

                  {/* Support */}
                  <Link 
                    to="/support" 
                    className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HelpCircle className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                    <span className="text-base font-medium">Support</span>
                  </Link>

                  {/* Admin/Agent Section - Only if user has permissions */}
                  {(check.canAccessAdmin || check.canWriteProperties) && (
                    <>
                      {/* Bold Separator for Admin Section */}
                      <div className="h-px bg-[#e3a04f]/40 my-3 mx-4"></div>
                      
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-[#3f4f24]/60 uppercase tracking-wider">
                          Management
                        </p>
                      </div>

                      <PermissionGuard permission={PERMISSIONS.ACCESS_ADMIN}>
                        <Link 
                          to="/admin" 
                          className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                          <span className="text-base font-medium">Admin Dashboard</span>
                        </Link>
                      </PermissionGuard>

                      <PermissionGuard permission={PERMISSIONS.WRITE_PROPERTIES}>
                        <Link 
                          to="/admin/add-property" 
                          className="flex items-center px-4 py-3 text-[#324c48] hover:bg-[#3f4f24]/5 rounded-lg transition-colors group"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Plus className="w-5 h-5 mr-3 text-[#3f4f24] group-hover:text-[#D4A017]" />
                          <span className="text-base font-medium">Add Property</span>
                        </Link>
                      </PermissionGuard>
                    </>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDF8F2] to-transparent">
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="h-11 bg-gray-200 animate-pulse rounded-lg"></div>
                    ) : !isAuthenticated ? (
                      <Button 
                        onClick={handleLogin} 
                        className="w-full bg-gradient-to-r from-[#3f4f24] to-[#324c48] text-white hover:from-[#324c48] hover:to-[#2a3f3c] shadow-lg h-11 rounded-lg font-semibold"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Login / Sign Up
                      </Button>
                    ) : (
                      <>
                        <Link 
                          to="/profile" 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button 
                            variant="outline"
                            className="w-full border-2 border-[#3f4f24] text-[#3f4f24] hover:bg-[#3f4f24]/5 h-11 rounded-lg font-semibold"
                          >
                            <User className="w-5 h-5 mr-2" />
                            My Profile
                          </Button>
                        </Link>
                        <Button 
                          onClick={handleLogout} 
                          variant="outline"
                          className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 h-11 rounded-lg font-semibold"
                        >
                          <LogOut className="w-5 h-5 mr-2" />
                          Logout
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Add padding at bottom to prevent overlap with fixed buttons */}
                <div className="h-32"></div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:ml-auto lg:space-x-8">
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-6">
                {/* Properties with dropdown - CLICK ONLY */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-base font-medium text-[#324c48] hover:text-[#D4A017] transition bg-transparent border-none outline-none">
                    Properties
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[400px] md:w-[500px] bg-[#FDF8F2] border border-[#e3a04f]/20 rounded-lg shadow-lg p-4">
                    <div className="grid gap-3">
                      {/* All Properties */}
                      <a href="/properties"
                        className="flex flex-col justify-end rounded-md bg-gradient-to-b from-[#3f4f24]/10 to-[#3f4f24]/20 p-6 no-underline outline-none focus:shadow-md hover:bg-gradient-to-b hover:from-[#3f4f24]/15 hover:to-[#3f4f24]/25 transition"
                      >
                        <div className="mb-2 text-lg font-medium text-[#3f4f24]">
                          All Properties
                        </div>
                        <p className="text-sm leading-tight text-[#324c48]">
                          Explore all available land properties across Texas
                        </p>
                      </a>

                      {/* Other areas */}
                      <div className="grid gap-2">
                        {areaItems.slice(1).map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#e3a04f]/10 hover:text-[#D4A017] focus:bg-[#e3a04f]/10 focus:text-[#D4A017]"
                          >
                            <div className="text-sm font-medium leading-none text-[#324c48]">
                              {item.name}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-[#324c48]/80">
                              {item.name === "Dallas Fort Worth" && "Discover land opportunities in the DFW metroplex"}
                              {item.name === "Austin" && "Find prime land in the Austin area"}
                              {item.name === "Houston" && "Explore properties in Greater Houston"}
                              {item.name === "San Antonio" && "Browse land in San Antonio region"}
                              {item.name === "Other Areas" && "Discover unique properties elsewhere in Texas"}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Other navigation items */}
                {[
                  { name: "Sell", path: "/sell" },
                  { name: "Financing", path: "/financing" },
                  { name: "About Us", path: "/about-us" },
                  { name: "Support", path: "/support" },
                ].map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink asChild>
                      <Link to={item.path} className="text-base font-medium text-[#324c48] hover:text-[#D4A017] transition">
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Auth0 Login Button or User Profile */}
            {isLoading ? (
              <div className="h-10 w-28 bg-gray-200 animate-pulse rounded"></div>
            ) : !isAuthenticated ? (
              <Button onClick={handleLogin} className="bg-[#3f4f24] text-white hover:bg-[#2c3b18]">
                Login / Sign Up
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-[#3f4f24] hover:text-[#D4A017] flex items-center">
                    {user?.picture ? <img src={user.picture} alt={getDisplayName()} className="w-8 h-8 rounded-full mr-2" /> : <User className="w-5 h-5 mr-2" />}
                    <span className="max-w-[150px] truncate">{getDisplayName()}</span>
                    <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#FDF8F2] border border-[#e3a04f] shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="text-[#324c48] hover:text-[#D4A017] cursor-pointer flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  {/* Show Admin Dashboard link only with access:admin permission */}
                  <PermissionGuard permission={PERMISSIONS.ACCESS_ADMIN}>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="text-[#324c48] hover:text-[#D4A017] cursor-pointer flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </PermissionGuard>

                  {/* Show property management links with write:properties permission */}
                  <PermissionGuard permission={PERMISSIONS.WRITE_PROPERTIES}>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/add-property" className="text-[#324c48] hover:text-[#D4A017] cursor-pointer flex items-center">
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Property
                      </Link>
                    </DropdownMenuItem>
                  </PermissionGuard>

                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-background-200 cursor-pointer flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
