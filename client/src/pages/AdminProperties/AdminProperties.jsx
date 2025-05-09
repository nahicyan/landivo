// client/src/pages/AdminProperties/AdminProperties.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { getAllProperties } from "@/utils/api";
import PropertiesTable from "@/components/PropertiesTable/PropertiesTable";
import { QuickEditModal } from "@/components/PropertyManagement/QuickEditModal";
import PropertyStats from "@/components/PropertyManagement/PropertyStats";
import { PropertyFilters } from "@/components/PropertyManagement/PropertyFilters";
import { PropertyRowManager } from "@/components/PropertyManagement/PropertyRowManager";
import { FeaturedPropertiesManager } from "@/components/PropertyManagement/FeaturedPropertiesManager";

// UI Components
import { Button } from "@/components/ui/button";
import { PuffLoader } from "react-spinners";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Plus,
  FileEdit,
  Trash2,
  MoreHorizontal,
  MapPin,
  DollarSign,
  PencilLine,
  Eye,
  BarChart3,
  ListFilter,
  Rows,
  ArrowLeftRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminProperties() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("properties");
  
  // Fetch properties
  const { data, isLoading, isError, refetch } = useQuery(
    "allProperties",
    getAllProperties,
    { refetchOnWindowFocus: false }
  );

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data) return {
      totalProperties: 0,
      availableProperties: 0,
      pendingProperties: 0,
      soldProperties: 0,
      averagePrice: 0,
      featuredProperties: 0,
      byArea: {}
    };

    const properties = data;
    const available = properties.filter(p => p.status === "Available").length;
    const pending = properties.filter(p => p.status === "Pending").length;
    const sold = properties.filter(p => p.status === "Sold").length;
    const featured = properties.filter(p => p.featured === "Yes" || p.featured === "Featured").length;
    
    // Calculate average price
    let totalPrice = 0;
    properties.forEach(property => {
      if (property.askingPrice) totalPrice += Number(property.askingPrice);
    });
    const avgPrice = properties.length > 0 ? totalPrice / properties.length : 0;
    
    // Properties by area
    const areaCount = {};
    properties.forEach(property => {
      const area = property.area || 'Unspecified';
      areaCount[area] = (areaCount[area] || 0) + 1;
    });

    return {
      totalProperties: properties.length,
      availableProperties: available,
      pendingProperties: pending,
      soldProperties: sold,
      featuredProperties: featured,
      averagePrice: avgPrice,
      byArea: areaCount
    };
  }, [data]);

  // Handle creating a new property
  const handleCreateProperty = () => {
    navigate("/admin/add-property");
  };

  // Handle editing a property
  const handleEditProperty = (propertyId) => {
    navigate(`/admin/edit-property/${propertyId}`);
  };

  // Handle view property details
  const handleViewProperty = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  // Handle quick edit
  const handleQuickEdit = (property) => {
    setSelectedProperty(property);
    setIsQuickEditOpen(true);
  };

  // Handle quick edit save
  const handleQuickEditSave = async (editedData) => {
    // Logic for saving quick edit data will go here
    console.log("Saving quick edit:", editedData);
    setIsQuickEditOpen(false);
    refetch(); // Refresh the data after edit
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-red-600 text-xl font-semibold">Error fetching properties data.</h2>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#324c48] mb-2">Property Management</h1>
            <p className="text-[#324c48] mb-2">
              Manage property listings, track status, and update information
            </p>
          </div>
          <Button 
            className="bg-[#324c48] hover:bg-[#3f4f24] text-white mt-4 md:mt-0"
            onClick={handleCreateProperty}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Property
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs
          defaultValue="properties"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="properties" className="flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              All Properties
            </TabsTrigger>
            <TabsTrigger value="rows" className="flex items-center">
              <Rows className="h-4 w-4 mr-2" />
              Property Rows
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Featured Properties
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties">
            {/* Stats Section */}
            {isLoading ? (
              <div className="flex justify-center p-12">
                <PuffLoader size={60} color="#3f4f24" />
              </div>
            ) : (
              <PropertyStats stats={stats} />
            )}

            {/* Full Properties Table */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-[#324c48] mb-4">Advanced Property Management</h2>
              <PropertiesTable />
            </div>
          </TabsContent>

          {/* Property Rows Tab */}
          <TabsContent value="rows">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#324c48] mb-4">Property Rows Management</h2>
              <p className="text-gray-500">
                Create and manage property display rows such as featured, homepage, and promotional sections.
              </p>
              <PropertyRowManager />
            </div>
          </TabsContent>

          {/* Featured Properties Tab */}
          <TabsContent value="featured">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#324c48] mb-4">Featured Properties Management</h2>
              <p className="text-gray-500">
                Manage the display order of featured properties and other property rows.
              </p>
              <FeaturedPropertiesManager />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <PropertyStats stats={stats} />
            {/* Additional analytics components could go here */}
          </TabsContent>
        </Tabs>

        {/* Quick Edit Modal */}
        {isQuickEditOpen && selectedProperty && (
          <QuickEditModal
            property={selectedProperty}
            isOpen={isQuickEditOpen}
            onClose={() => setIsQuickEditOpen(false)}
            onSave={handleQuickEditSave}
          />
        )}
      </div>
    </div>
  );
}