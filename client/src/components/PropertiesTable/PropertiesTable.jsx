// client/src/components/PropertiesTable/PropertiesTable.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import useProperties from "../../components/hooks/useProperties.js";
import { DataTable } from "../DataTable/DataTable";
import PropertiesTableFilter from "../PropertiesTableFilter/PropertiesTableFilter";
import { QuickEditModal } from "@/components/PropertyManagement/QuickEditModal";
import { usePropertyDeletion } from "@/hooks/usePropertyDeletion";
import { usePropertyBulkDeletion } from "@/hooks/usePropertyBulkDeletion";
import { PropertyDeletionModal } from "@/components/PropertyManagement/PropertyDeletionModal";
import { PropertyBulkDeletionModal } from "@/components/PropertyManagement/PropertyBulkDeletionModal";
import { 
  MoreHorizontal, 
  PencilIcon, 
  TrashIcon, 
  TrendingDown, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  PencilLine,
  X,
  Trash
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PropertiesTable({ propertyData }) {
  const { data, isError, isLoading, refetch } = useProperties();
  
  // Generic search query
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Track expanded cells for rich text content
  const [expandedCells, setExpandedCells] = useState({});

  // For quick edit modal
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  // For checkbox selection
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  // Single property deletion hook
  const {
    isConfirmOpen,
    selectedProperty: selectedPropertyForDeletion,
    currentStep,
    isPermissionLoading,
    isLoading: isDeletionLoading,
    hasDeletePermission,
    requiresStatusConfirmation,
    canDirectDelete,
    canDeleteProperty,
    openDeletionConfirm,
    closeDeletionConfirm,
    handleInitialConfirm,
    executePropertyDeletion,
    DELETION_STEPS,
  } = usePropertyDeletion();

  // Bulk property deletion hook
  const {
    isConfirmOpen: isBulkConfirmOpen,
    selectedProperties: selectedPropertiesForDeletion,
    currentStep: bulkCurrentStep,
    isPermissionLoading: isBulkPermissionLoading,
    isLoading: isBulkDeletionLoading,
    hasDeletePermission: hasBulkDeletePermission,
    requiresStatusConfirmation: bulkRequiresStatusConfirmation,
    canDirectDelete: bulkCanDirectDelete,
    statusAnalysis,
    openBulkDeletionConfirm,
    closeBulkDeletionConfirm,
    handleInitialConfirm: handleBulkInitialConfirm,
    executeBulkPropertyDeletion,
    BULK_DELETION_STEPS,
  } = usePropertyBulkDeletion();

  // All available columns from schema
  const allAvailableColumns = [
    { id: "streetAddress", name: "Street Address", accessor: "streetAddress" },
    { id: "title", name: "Title", accessor: "title", isRichText: true },
    { id: "status", name: "Status", accessor: "status" },
    {
      id: "location",
      name: "Location",
      accessor: (row) => `${row.city}, ${row.state}`,
    },
    { id: "askingPrice", name: "Asking Price", accessor: "askingPrice" },
    { id: "area", name: "Area", accessor: "area" },
    { id: "ownerId", name: "Owner ID", accessor: "ownerId" },
    { id: "featured", name: "Featured", accessor: "featured" },
    {
      id: "description",
      name: "Description",
      accessor: "description",
      isRichText: true,
    },
    { id: "city", name: "City", accessor: "city" },
    { id: "county", name: "County", accessor: "county" },
    { id: "state", name: "State", accessor: "state" },
    { id: "zip", name: "ZIP", accessor: "zip" },
    { id: "apnOrPin", name: "APN/PIN", accessor: "apnOrPin" },
    { id: "latitude", name: "Latitude", accessor: "latitude" },
    { id: "longitude", name: "Longitude", accessor: "longitude" },
    { id: "sqft", name: "Square Feet", accessor: "sqft" },
    { id: "acre", name: "Acres", accessor: "acre" },
    { id: "minPrice", name: "Min Price", accessor: "minPrice" },
    { id: "financing", name: "Financing", accessor: "financing" },
    { id: "water", name: "Water", accessor: "water" },
    { id: "sewer", name: "Sewer", accessor: "sewer" },
    { id: "electric", name: "Electric", accessor: "electric" },
    { id: "roadCondition", name: "Road Condition", accessor: "roadCondition" },
    { id: "floodplain", name: "Floodplain", accessor: "floodplain" },
    { id: "zoning", name: "Zoning", accessor: "zoning" },
    { id: "restrictions", name: "Restrictions", accessor: "restrictions" },
    {
      id: "mobileHomeFriendly",
      name: "Mobile Home Friendly",
      accessor: "mobileHomeFriendly",
    },
    { id: "hoaPoa", name: "HOA/POA", accessor: "hoaPoa" },
    { id: "hoaFee", name: "HOA Fee", accessor: "hoaFee" },
    { id: "notes", name: "Notes", accessor: "notes", isRichText: true },
    { id: "createdAt", name: "Created At", accessor: "createdAt" },
    { id: "updatedAt", name: "Updated At", accessor: "updatedAt" },
  ];

  // Default visible columns
  const [visibleColumns, setVisibleColumns] = useState([
    "streetAddress",
    "location",
    "askingPrice",
    "status",
    "area",
    "featured",
  ]);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    area: "all",
    priceRange: [0, 5000000],
    minPriceDisplay: "0",
    maxPriceDisplay: "5,000,000",
    ownerId: "",
    squareFeet: [0, 500000],
    minSqftDisplay: "0",
    maxSqftDisplay: "500,000",
    ownershipType: "",
    financing: "all",
  });

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle checkbox selection
  const handleRowSelection = (rowId, checked) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    setIsSelectAllChecked(checked);
    if (checked) {
      const allIds = new Set(filteredData.map((row) => row.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedRows(new Set());
    setIsSelectAllChecked(false);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    const selectedProperties = filteredData.filter((property) =>
      selectedRows.has(property.id)
    );
    openBulkDeletionConfirm(selectedProperties);
  };

  // Handle quick edit
  const handleQuickEdit = (property) => {
    setSelectedProperty(property);
    setIsQuickEditOpen(true);
  };

  // Handle quick edit save
  const handleQuickEditSave = (editedData) => {
    setIsQuickEditOpen(false);
    setTimeout(() => {
      refetch();
    }, 500);
  };

  // Helper function to toggle cell expansion
  const toggleCellExpansion = (rowId, columnId) => {
    const cellKey = `${rowId}-${columnId}`;
    setExpandedCells((prev) => ({
      ...prev,
      [cellKey]: !prev[cellKey],
    }));
  };

  // Helper function to check if a cell is expanded
  const isCellExpanded = (rowId, columnId) => {
    const cellKey = `${rowId}-${columnId}`;
    return !!expandedCells[cellKey];
  };

  // Helper function to render rich text content with truncation
  const renderRichTextContent = (content, rowId, columnId, maxLength = 100) => {
    if (!content) return <span className="text-gray-400">N/A</span>;

    const isExpanded = isCellExpanded(rowId, columnId);

    const textContent = content.replace(/<[^>]*>/g, "");
    const needsTruncation = textContent.length > maxLength;

    const displayContent =
      isExpanded || !needsTruncation
        ? content
        : content.substring(0, maxLength) + "...";

    return (
      <div className="relative">
        <div
          className={`rich-text-cell ${
            isExpanded ? "max-h-none" : "max-h-24 overflow-hidden"
          }`}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />

        {needsTruncation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleCellExpansion(rowId, columnId);
            }}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800 p-0 h-6"
          >
            {isExpanded ? (
              <span className="flex items-center">
                Show less <ChevronUp className="ml-1 h-3 w-3" />
              </span>
            ) : (
              <span className="flex items-center">
                Show more <ChevronDown className="ml-1 h-3 w-3" />
              </span>
            )}
          </Button>
        )}
      </div>
    );
  };

  // Generate dynamic columns based on visibleColumns
  const dynamicColumns = useMemo(() => {
    const columns = [
      // Checkbox column (leftmost)
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={isSelectAllChecked}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRows.has(row.original.id)}
            onCheckedChange={(checked) =>
              handleRowSelection(row.original.id, checked)
            }
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // Dynamic data columns
      ...visibleColumns
        .map((colId) => {
          const columnDef = allAvailableColumns.find((col) => col.id === colId);
          if (!columnDef) return null;

          return {
            accessorKey: columnDef.id,
            header: columnDef.name,
            cell: ({ row }) => {
              const value =
                typeof columnDef.accessor === "function"
                  ? columnDef.accessor(row.original)
                  : row.original[columnDef.accessor];

              // Handle rich text fields specially
              if (columnDef.isRichText) {
                return renderRichTextContent(value, row.id, columnDef.id);
              }

              // Format different types of data
              if (
                colId === "askingPrice" ||
                colId === "minPrice" ||
                colId === "hoaFee"
              ) {
                return value ? `$${Number(value).toLocaleString()}` : "N/A";
              } else if (colId === "sqft") {
                return value ? `${Number(value).toLocaleString()} sqft` : "N/A";
              } else if (colId === "acre") {
                return value ? `${Number(value).toFixed(2)} acres` : "N/A";
              } else if (colId === "status") {
                return (
                  <Badge
                    className={
                      value === "Available"
                        ? "bg-green-100 text-green-800"
                        : value === "Pending"
                        ? "bg-orange-100 text-orange-800"
                        : value === "Sold"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {value || "Unknown"}
                  </Badge>
                );
              } else if (colId === "featured") {
                return value === "Featured" ? (
                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                ) : (
                  "No"
                );
              } else if (colId === "createdAt" || colId === "updatedAt") {
                return value ? new Date(value).toLocaleDateString() : "N/A";
              } else if (typeof value === "boolean") {
                return value ? "Yes" : "No";
              }

              return value || "N/A";
            },
          };
        })
        .filter(Boolean),
      // Actions column (rightmost)
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const property = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedProperty(property);
                    setIsQuickEditOpen(true);
                  }}
                  className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  Quick Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(`/admin/edit-property/${property.id}`, "_blank")
                  }
                  className="cursor-pointer text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit Property
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(`/properties/${property.id}`, "_blank")
                  }
                  className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `/admin/edit-property/${property.id}/discount`,
                      "_blank"
                    )
                  }
                  className="cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Discount Property
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDeletionConfirm(property)}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Property
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];

    return columns;
  }, [
    visibleColumns,
    expandedCells,
    canDeleteProperty,
    openDeletionConfirm,
    selectedRows,
    isSelectAllChecked,
  ]);

  // Parse filtered data
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((property) => {
      // General search query filtering
      const searchFields = [
        property.title,
        property.streetAddress,
        property.state,
        property.zip,
        property.area,
        property.apnOrPin,
        property.ltag,
        property.rtag,
        property.city,
        property.county,
      ];

      const matchesSearchQuery =
        !searchQuery ||
        searchFields.some((field) => {
          if (field && typeof field === "string" && field.includes("<")) {
            const textContent = field.replace(/<[^>]*>/g, "");
            return textContent.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return field && field.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });

      // Advanced filters
      const matchesStatus =
        filters.status === "all" || property.status === filters.status;
      const matchesArea =
        filters.area === "all" || property.area === filters.area;
      const matchesOwner =
        !filters.ownerId || property.ownerId?.toString() === filters.ownerId;
      const matchesFinancing =
        filters.financing === "all" || property.financing === filters.financing;

      // Price range filtering
      const propertyPrice = parseFloat(property.askingPrice || 0);
      const withinPriceRange =
        propertyPrice >= filters.priceRange[0] &&
        propertyPrice <= filters.priceRange[1];

      // Square footage filtering
      const propertySqft = parseFloat(property.sqft || 0);
      const withinSqftRange =
        propertySqft >= filters.squareFeet[0] &&
        propertySqft <= filters.squareFeet[1];

      return (
        matchesSearchQuery &&
        matchesStatus &&
        matchesArea &&
        withinPriceRange &&
        matchesOwner &&
        withinSqftRange &&
        matchesFinancing
      );
    });
  }, [data, searchQuery, filters]);

  // Update active filters for display
  useEffect(() => {
    const newActiveFilters = [];

    if (filters.status && filters.status !== "all") {
      newActiveFilters.push({
        type: "status",
        value: filters.status,
        label: `Status: ${filters.status}`,
      });
    }

    if (filters.area && filters.area !== "all") {
      newActiveFilters.push({
        type: "area",
        value: filters.area,
        label: `Area: ${filters.area}`,
      });
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) {
      newActiveFilters.push({
        type: "priceRange",
        value: filters.priceRange,
        label: `Price: ${formatNumber(filters.priceRange[0])} - ${formatNumber(
          filters.priceRange[1]
        )}`,
      });
    }

    if (filters.ownerId) {
      newActiveFilters.push({
        type: "ownerId",
        value: filters.ownerId,
        label: `Owner ID: ${filters.ownerId}`,
      });
    }

    if (filters.squareFeet[0] > 0 || filters.squareFeet[1] < 500000) {
      newActiveFilters.push({
        type: "squareFeet",
        value: filters.squareFeet,
        label: `Size: ${formatNumber(filters.squareFeet[0])} - ${formatNumber(
          filters.squareFeet[1]
        )} sqft`,
      });
    }

    if (filters.financing && filters.financing !== "all") {
      newActiveFilters.push({
        type: "financing",
        value: filters.financing,
        label: `Financing: ${filters.financing}`,
      });
    }

    setActiveFilters(newActiveFilters);
  }, [filters]);

  // Remove a specific filter
  const removeFilter = (type, value) => {
    if (type === "priceRange") {
      setFilters((prev) => ({
        ...prev,
        priceRange: [0, 5000000],
        minPriceDisplay: "0",
        maxPriceDisplay: "5,000,000",
      }));
    } else if (type === "squareFeet") {
      setFilters((prev) => ({
        ...prev,
        squareFeet: [0, 500000],
        minSqftDisplay: "0",
        maxSqftDisplay: "500,000",
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [type]: type === "ownerId" ? "" : "all",
      }));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setFilters({
      status: "all",
      area: "all",
      priceRange: [0, 5000000],
      minPriceDisplay: "0",
      maxPriceDisplay: "5,000,000",
      ownerId: "",
      squareFeet: [0, 500000],
      minSqftDisplay: "0",
      maxSqftDisplay: "500,000",
      ownershipType: "",
      financing: "all",
    });
  };

  // CSS for rich text cells
  const richTextCellStyles = `
    .rich-text-cell {
      line-height: 1.5;
      transition: max-height 0.3s ease-in-out;
    }
    
    .rich-text-cell p {
      margin-bottom: 0.5rem;
    }
    
    .rich-text-cell h1, .rich-text-cell h2, .rich-text-cell h3, 
    .rich-text-cell h4, .rich-text-cell h5, .rich-text-cell h6 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    
    .rich-text-cell ul, .rich-text-cell ol {
      margin-left: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .rich-text-cell a {
      color: #3b82f6;
      text-decoration: underline;
    }
  `;

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-red-600 text-xl font-semibold">
          Error fetching data.
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#404040" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FDF8F2] rounded-lg p-4 sm:p-6">
      {/* Inject CSS for rich text styling */}
      <style>{richTextCellStyles}</style>

      <div className="space-y-4">
        {/* Properties Table Filter */}
        <PropertiesTableFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          activeFilters={activeFilters}
          clearAllFilters={clearAllFilters}
          removeFilter={removeFilter}
          formatNumber={formatNumber}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          availableColumns={allAvailableColumns}
        />

        {/* Bulk Actions Bar */}
        {selectedRows.size > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedRows.size} {selectedRows.size === 1 ? "property" : "properties"} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSelections}
                  className="h-7 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear Selection
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete Selected ({selectedRows.size})
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "result" : "results"} found
          </p>
          <div className="text-sm text-gray-600">
            {visibleColumns.length} columns visible
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <DataTable columns={dynamicColumns} data={filteredData} />
        </div>
      </div>

      {/* Quick Edit Modal */}
      {selectedProperty && (
        <QuickEditModal
          property={selectedProperty}
          isOpen={isQuickEditOpen}
          onClose={() => setIsQuickEditOpen(false)}
          onSave={handleQuickEditSave}
        />
      )}

      {/* Single Property Deletion Modal */}
      <PropertyDeletionModal
        isOpen={isConfirmOpen}
        onClose={closeDeletionConfirm}
        property={selectedPropertyForDeletion}
        onConfirm={executePropertyDeletion}
        isLoading={isDeletionLoading}
        currentStep={currentStep}
        isPermissionLoading={isPermissionLoading}
        hasDeletePermission={hasDeletePermission}
        requiresStatusConfirmation={requiresStatusConfirmation}
        canDirectDelete={canDirectDelete}
        onInitialConfirm={handleInitialConfirm}
        DELETION_STEPS={DELETION_STEPS}
      />

      {/* Bulk Property Deletion Modal */}
      <PropertyBulkDeletionModal
        isOpen={isBulkConfirmOpen}
        onClose={closeBulkDeletionConfirm}
        properties={selectedPropertiesForDeletion}
        onConfirm={executeBulkPropertyDeletion}
        isLoading={isBulkDeletionLoading}
        currentStep={bulkCurrentStep}
        isPermissionLoading={isBulkPermissionLoading}
        hasDeletePermission={hasBulkDeletePermission}
        requiresStatusConfirmation={bulkRequiresStatusConfirmation}
        canDirectDelete={bulkCanDirectDelete}
        onInitialConfirm={handleBulkInitialConfirm}
        statusAnalysis={statusAnalysis}
        BULK_DELETION_STEPS={BULK_DELETION_STEPS}
      />
    </div>
  );
}