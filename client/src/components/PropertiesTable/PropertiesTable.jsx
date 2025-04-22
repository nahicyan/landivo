// PropertiesTable.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import useProperties from "../../components/hooks/useProperties.js";
import { DataTable } from "../DataTable/DataTable";
import PropertiesTableFilter from "../PropertiesTableFilter/PropertiesTableFilter";
import { 
  MoreHorizontal, 
  PencilIcon, 
  TrashIcon, 
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PropertiesTable({ propertyData }) {
  const { data, isError, isLoading } = useProperties();
  // Generic search query
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  // Track expanded cells for rich text content
  const [expandedCells, setExpandedCells] = useState({});
  
  // All available columns from schema
  const allAvailableColumns = [
    { id: "streetAddress", name: "Street Address", accessor: "streetAddress" },
    { id: "title", name: "Title", accessor: "title", isRichText: true },
    { id: "status", name: "Status", accessor: "status" },
    { id: "location", name: "Location", accessor: (row) => `${row.city}, ${row.state}` },
    { id: "askingPrice", name: "Asking Price", accessor: "askingPrice" },
    { id: "area", name: "Area", accessor: "area" },
    { id: "ownerId", name: "Owner ID", accessor: "ownerId" },
    { id: "featured", name: "Featured", accessor: "featured" },
    { id: "description", name: "Description", accessor: "description", isRichText: true },
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
    { id: "mobileHomeFriendly", name: "Mobile Home Friendly", accessor: "mobileHomeFriendly" },
    { id: "hoaPoa", name: "HOA/POA", accessor: "hoaPoa" },
    { id: "hoaFee", name: "HOA Fee", accessor: "hoaFee" },
    { id: "notes", name: "Notes", accessor: "notes", isRichText: true },
    { id: "createdAt", name: "Created At", accessor: "createdAt" },
    { id: "updatedAt", name: "Updated At", accessor: "updatedAt" },
  ];

  // Default visible columns
  const [visibleColumns, setVisibleColumns] = useState([
    "streetAddress", "location", "askingPrice", "status", "area"
  ]);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    area: "all",
    priceRange: [0, 5000000], // Default price range from 0 to 5,000,000
    minPriceDisplay: "0", // For display purposes
    maxPriceDisplay: "5,000,000", // For display purposes
    ownerId: "",
    squareFeet: [0, 500000], // Default square feet range
    minSqftDisplay: "0",
    maxSqftDisplay: "500,000",
    ownershipType: "",
    financing: "all",
  });

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function to toggle cell expansion
  const toggleCellExpansion = (rowId, columnId) => {
    const cellKey = `${rowId}-${columnId}`;
    setExpandedCells(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
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
    const cellKey = `${rowId}-${columnId}`;
    
    // Strip HTML to get approximate text length for truncation decision
    const textContent = content.replace(/<[^>]*>/g, '');
    const needsTruncation = textContent.length > maxLength;
    
    // Create a safe version of the content for display
    const displayContent = isExpanded || !needsTruncation ? 
      content : 
      content.substring(0, maxLength) + '...';
    
    return (
      <div className="relative">
        <div
          className={`rich-text-cell ${isExpanded ? 'max-h-none' : 'max-h-24 overflow-hidden'}`}
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
              <span className="flex items-center">Show less <ChevronUp className="ml-1 h-3 w-3" /></span>
            ) : (
              <span className="flex items-center">Show more <ChevronDown className="ml-1 h-3 w-3" /></span>
            )}
          </Button>
        )}
      </div>
    );
  };

  // Generate dynamic columns based on visibleColumns
  const dynamicColumns = useMemo(() => {
    // Always include actions column
    const columns = [
      ...visibleColumns.map(colId => {
        const columnDef = allAvailableColumns.find(col => col.id === colId);
        if (!columnDef) return null;
        
        return {
          accessorKey: columnDef.id,
          header: columnDef.name,
          cell: ({ row }) => {
            const value = typeof columnDef.accessor === 'function' 
              ? columnDef.accessor(row.original) 
              : row.original[columnDef.accessor];
            
            // Handle rich text fields specially
            if (columnDef.isRichText) {
              return renderRichTextContent(value, row.id, columnDef.id);
            }
            
            // Format different types of data
            if (colId === 'askingPrice' || colId === 'minPrice' || colId === 'hoaFee') {
              return value ? `$${Number(value).toLocaleString()}` : 'N/A';
            } else if (colId === 'sqft') {
              return value ? `${Number(value).toLocaleString()} sqft` : 'N/A';
            } else if (colId === 'acre') {
              return value ? `${Number(value).toFixed(2)} acres` : 'N/A';
            } else if (colId === 'status') {
              return (
                <Badge className={
                  value === 'Available' ? 'bg-green-100 text-green-800' : 
                  value === 'Pending' ? 'bg-orange-100 text-orange-800' : 
                  value === 'Sold' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }>
                  {value || 'Unknown'}
                </Badge>
              );
            } else if (colId === 'featured') {
              return value === 'Yes' ? 'Yes' : 'No';
            } else if (colId === 'createdAt' || colId === 'updatedAt') {
              return value ? new Date(value).toLocaleDateString() : 'N/A';
            } else if (typeof value === 'boolean') {
              return value ? 'Yes' : 'No';
            }
            
            return value || 'N/A';
          }
        };
      }).filter(Boolean),
      {
        id: "actions",
        cell: ({ row }) => {
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open(`/properties/${row.original.id}`, '_blank')}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/admin/edit-property/${row.original.id}`, '_blank')}>
                  <PencilIcon className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }
    ];
    
    return columns;
  }, [visibleColumns, expandedCells]);

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
        property.county
      ];
      
      const matchesSearchQuery = !searchQuery || searchFields.some(field => {
        // Strip HTML for text search if field is rich text
        if (field && typeof field === 'string' && field.includes('<')) {
          const textContent = field.replace(/<[^>]*>/g, '');
          return textContent.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return field && field.toString().toLowerCase().includes(searchQuery.toLowerCase());
      });
      
      // Advanced filters
      const matchesStatus = filters.status === "all" || property.status === filters.status;
      const matchesArea = filters.area === "all" || property.area === filters.area;
      const matchesOwner = !filters.ownerId || property.ownerId?.toString() === filters.ownerId;
      const matchesFinancing = filters.financing === "all" || property.financing === filters.financing;
      
      // Price range filtering
      const propertyPrice = parseFloat(property.askingPrice || 0);
      const withinPriceRange = propertyPrice >= filters.priceRange[0] && 
                               propertyPrice <= filters.priceRange[1];
      
      // Square footage filtering
      const propertySqft = parseFloat(property.sqft || 0);
      const withinSqftRange = propertySqft >= filters.squareFeet[0] && 
                              propertySqft <= filters.squareFeet[1];
      
      return matchesSearchQuery && 
             matchesStatus && 
             matchesArea && 
             withinPriceRange && 
             matchesOwner &&
             withinSqftRange &&
             matchesFinancing;
    });
  }, [data, searchQuery, filters]);

  // Update active filters for display
  useEffect(() => {
    const newActiveFilters = [];
    
    if (filters.status && filters.status !== "all") {
      newActiveFilters.push({ 
        type: 'status', 
        value: filters.status, 
        label: `Status: ${filters.status}` 
      });
    }
    
    if (filters.area && filters.area !== "all") {
      newActiveFilters.push({ 
        type: 'area', 
        value: filters.area, 
        label: `Area: ${filters.area}` 
      });
    }
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) {
      newActiveFilters.push({ 
        type: 'priceRange', 
        value: filters.priceRange, 
        label: `Price: ${formatNumber(filters.priceRange[0])} - ${formatNumber(filters.priceRange[1])}` 
      });
    }
    
    if (filters.ownerId) {
      newActiveFilters.push({ 
        type: 'ownerId', 
        value: filters.ownerId, 
        label: `Owner ID: ${filters.ownerId}` 
      });
    }
    
    if (filters.squareFeet[0] > 0 || filters.squareFeet[1] < 500000) {
      newActiveFilters.push({ 
        type: 'squareFeet', 
        value: filters.squareFeet, 
        label: `Size: ${formatNumber(filters.squareFeet[0])} - ${formatNumber(filters.squareFeet[1])} sqft` 
      });
    }

    if (filters.financing && filters.financing !== "all") {
      newActiveFilters.push({ 
        type: 'financing', 
        value: filters.financing, 
        label: `Financing: ${filters.financing}` 
      });
    }
    
    setActiveFilters(newActiveFilters);
  }, [filters]);

  // Remove a specific filter
  const removeFilter = (type, value) => {
    if (type === 'priceRange') {
      setFilters(prev => ({
        ...prev,
        priceRange: [0, 5000000],
        minPriceDisplay: "0",
        maxPriceDisplay: "5,000,000"
      }));
    } else if (type === 'squareFeet') {
      setFilters(prev => ({
        ...prev,
        squareFeet: [0, 500000],
        minSqftDisplay: "0",
        maxSqftDisplay: "500,000"
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [type]: type === "ownerId" ? "" : "all"
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
        <h2 className="text-red-600 text-xl font-semibold">Error fetching data.</h2>
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

        {/* Results Count */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredData.length} {filteredData.length === 1 ? "result" : "results"} found
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
    </div>
  );
}