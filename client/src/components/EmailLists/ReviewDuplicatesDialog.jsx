import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Search, 
  UserX, 
  UserPlus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  CheckSquare
} from "lucide-react";
import { toast } from "react-toastify";

const ACTION_OPTIONS = [
  { 
    value: 'skip', 
    label: 'Do not import', 
    icon: UserX, 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  { 
    value: 'update', 
    label: 'Update and keep on all lists', 
    icon: UserPlus, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    value: 'replace', 
    label: 'Remove from existing lists, add to current', 
    icon: RefreshCw, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
];

export default function ReviewDuplicatesDialog({ 
  open, 
  onOpenChange, 
  duplicateBuyers,
  onActionsCompleted,
  initialActions = new Map()
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDuplicates, setFilteredDuplicates] = useState([]);
  const [selectedBuyers, setSelectedBuyers] = useState(new Set());
  const [actions, setActions] = useState(new Map(initialActions));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Calculate pagination
  const totalPages = Math.ceil(filteredDuplicates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDuplicates = filteredDuplicates.slice(startIndex, endIndex);

  // Filter duplicates when search query changes
  useEffect(() => {
    if (!duplicateBuyers.length) return;
    
    if (!searchQuery.trim()) {
      setFilteredDuplicates(duplicateBuyers);
      setCurrentPage(1);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = duplicateBuyers.filter(duplicate => 
      duplicate.csvData.firstName?.toLowerCase().includes(query) ||
      duplicate.csvData.lastName?.toLowerCase().includes(query) ||
      duplicate.csvData.email.toLowerCase().includes(query) ||
      duplicate.existingBuyer.firstName?.toLowerCase().includes(query) ||
      duplicate.existingBuyer.lastName?.toLowerCase().includes(query) ||
      duplicate.existingBuyer.email.toLowerCase().includes(query)
    );
    
    setFilteredDuplicates(filtered);
    setCurrentPage(1);
  }, [duplicateBuyers, searchQuery]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFilteredDuplicates(duplicateBuyers);
      setSelectedBuyers(new Set());
      setSearchQuery("");
      setCurrentPage(1);
    }
  }, [open, duplicateBuyers]);

  // Handle selecting/deselecting a buyer
  const handleSelectBuyer = (buyerEmail) => {
    setSelectedBuyers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(buyerEmail)) {
        newSelected.delete(buyerEmail);
      } else {
        newSelected.add(buyerEmail);
      }
      return newSelected;
    });
  };

  // Handle selecting/deselecting all visible buyers on current page
  const handleSelectAllCurrentPage = (checked) => {
    if (checked) {
      const visibleEmails = currentDuplicates.map(duplicate => duplicate.existingBuyer.email);
      setSelectedBuyers(prev => new Set([...prev, ...visibleEmails]));
    } else {
      const visibleEmails = new Set(currentDuplicates.map(duplicate => duplicate.existingBuyer.email));
      setSelectedBuyers(prev => new Set([...prev].filter(email => !visibleEmails.has(email))));
    }
  };

  // Handle selecting/deselecting all buyers across all pages
  const handleSelectAllPages = (checked) => {
    if (checked) {
      const allEmails = filteredDuplicates.map(duplicate => duplicate.existingBuyer.email);
      setSelectedBuyers(new Set(allEmails));
      toast.success(`Selected all ${allEmails.length} duplicate buyers across all pages`);
    } else {
      setSelectedBuyers(new Set());
      toast.info("Cleared all selections");
    }
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    if (selectedBuyers.size === 0) {
      toast.error("No buyers selected");
      return;
    }

    const newActions = new Map(actions);
    selectedBuyers.forEach(email => {
      newActions.set(email, action);
    });
    
    setActions(newActions);
    setSelectedBuyers(new Set()); // Clear selection after applying action
    
    const actionLabel = ACTION_OPTIONS.find(opt => opt.value === action)?.label || action;
    toast.success(`Applied "${actionLabel}" to ${selectedBuyers.size} buyers`);
  };

  // Handle individual action change
  const handleActionChange = (email, action) => {
    const newActions = new Map(actions);
    if (action) {
      newActions.set(email, action);
    } else {
      newActions.delete(email);
    }
    setActions(newActions);
  };

  // Clear all actions
  const handleClearAll = () => {
    setActions(new Map());
    setSelectedBuyers(new Set());
  };

  // Clear all selections
  const handleClearSelections = () => {
    setSelectedBuyers(new Set());
  };

  // Handle completion
  const handleComplete = () => {
    const unhandledCount = duplicateBuyers.length - actions.size;
    
    if (unhandledCount > 0) {
      toast.error(`Please handle all ${unhandledCount} remaining duplicate buyers`);
      return;
    }

    onActionsCompleted(actions);
  };

  // Get action for a buyer
  const getActionForBuyer = (email) => {
    return actions.get(email);
  };

  // Get action badge
  const getActionBadge = (action) => {
    if (!action) return null;
    
    const actionConfig = ACTION_OPTIONS.find(opt => opt.value === action);
    if (!actionConfig) return null;

    const Icon = actionConfig.icon;
    
    return (
      <Badge 
        variant="outline" 
        className={`${actionConfig.bgColor} ${actionConfig.color} ${actionConfig.borderColor} text-xs`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {actionConfig.label}
      </Badge>
    );
  };

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Calculate selection states
  const currentPageEmails = new Set(currentDuplicates.map(d => d.existingBuyer.email));
  const allCurrentPageSelected = currentPageEmails.size > 0 && 
    [...currentPageEmails].every(email => selectedBuyers.has(email));
  const someCurrentPageSelected = [...currentPageEmails].some(email => selectedBuyers.has(email));
  
  const allPagesEmails = new Set(filteredDuplicates.map(d => d.existingBuyer.email));
  const allPagesSelected = allPagesEmails.size > 0 && selectedBuyers.size === allPagesEmails.size;

  const handledCount = actions.size;
  const remainingCount = duplicateBuyers.length - handledCount;
  const allHandled = remainingCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Review Duplicate Buyers
          </DialogTitle>
          <DialogDescription>
            Choose how to handle each duplicate buyer found in your CSV file.
            All duplicates must be handled before you can proceed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden py-4">
          {/* Progress indicator */}
          <div className="mb-4 p-3 bg-[#f0f5f4] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#324c48]">
                Progress: {handledCount} of {duplicateBuyers.length} handled
              </span>
              <span className="text-sm text-gray-600">
                {remainingCount} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  allHandled ? 'bg-green-500' : 'bg-[#324c48]'
                }`}
                style={{ width: `${(handledCount / duplicateBuyers.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Search and selection controls */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search duplicate buyers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-[#324c48]/30"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelections}
                  className="border-gray-300 text-gray-600"
                  disabled={selectedBuyers.size === 0}
                >
                  Clear Selections
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="border-gray-300 text-gray-600"
                >
                  Clear All Actions
                </Button>
              </div>
            </div>

            {/* Select all across pages */}
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allPagesSelected}
                  onCheckedChange={handleSelectAllPages}
                  className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label className="text-sm font-medium text-blue-800 cursor-pointer">
                  Select all {filteredDuplicates.length} duplicate buyers across all pages
                </Label>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedBuyers.size} selected
                </span>
              </div>
            </div>
          </div>

          {/* Bulk actions for selected */}
          {selectedBuyers.size > 0 && (
            <div className="bg-[#f0f5f4] mb-4 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#324c48]" />
                <span className="text-sm font-medium text-[#324c48]">
                  {selectedBuyers.size} buyers selected
                  {selectedBuyers.size > currentDuplicates.length && (
                    <span className="text-xs text-gray-600 ml-1">
                      (across multiple pages)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                {ACTION_OPTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.value}
                      size="sm"
                      variant="outline"
                      className={`h-8 text-xs ${action.color} border-current`}
                      onClick={() => handleBulkAction(action.value)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Duplicates Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <div className="flex flex-col gap-1">
                      <Checkbox
                        checked={allCurrentPageSelected}
                        ref={(ref) => {
                          if (ref) {
                            ref.indeterminate = someCurrentPageSelected && !allCurrentPageSelected;
                          }
                        }}
                        onCheckedChange={handleSelectAllCurrentPage}
                        className="border-[#324c48]/50"
                      />
                      <span className="text-xs text-gray-500">Page</span>
                    </div>
                  </TableHead>
                  <TableHead>CSV Data</TableHead>
                  <TableHead>Existing Buyer</TableHead>
                  <TableHead>Current Lists</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDuplicates.length > 0 ? (
                  currentDuplicates.map((duplicate) => {
                    const email = duplicate.existingBuyer.email;
                    const action = getActionForBuyer(email);
                    const isSelected = selectedBuyers.has(email);
                    
                    return (
                      <TableRow key={email} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectBuyer(email)}
                          />
                        </TableCell>
                        
                        {/* CSV Data */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {duplicate.csvData.firstName} {duplicate.csvData.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{duplicate.csvData.email}</div>
                            <div className="text-xs text-gray-500">{duplicate.csvData.phone}</div>
                            {duplicate.csvData.buyerType && (
                              <Badge variant="outline" className="text-xs">
                                {duplicate.csvData.buyerType}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Existing Buyer */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {duplicate.existingBuyer.firstName} {duplicate.existingBuyer.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{duplicate.existingBuyer.email}</div>
                            <div className="text-xs text-gray-500">{duplicate.existingBuyer.phone}</div>
                            {duplicate.existingBuyer.buyerType && (
                              <Badge variant="outline" className="text-xs">
                                {duplicate.existingBuyer.buyerType}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Current Lists */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {duplicate.existingBuyer.emailListMemberships?.map((membership, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-[#f0f5f4]">
                                {membership.emailList?.name || 'Unknown List'}
                              </Badge>
                            )) || (
                              <span className="text-xs text-gray-500">No lists</span>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Action Selector */}
                        <TableCell>
                          <Select
                            value={action || ""}
                            onValueChange={(value) => handleActionChange(email, value)}
                          >
                            <SelectTrigger className="w-[200px] h-8">
                              <SelectValue placeholder="Choose action..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_OPTIONS.map(option => {
                                const Icon = option.icon;
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className={`h-3 w-3 ${option.color}`} />
                                      <span className="text-xs">{option.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell>
                          {action ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {getActionBadge(action)}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-xs text-orange-600">Needs action</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchQuery 
                        ? "No duplicates match your search."
                        : "No duplicate buyers found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDuplicates.length)} of {filteredDuplicates.length} duplicates
                {selectedBuyers.size > 0 && (
                  <span className="ml-2 text-[#324c48] font-medium">
                    ({selectedBuyers.size} selected across all pages)
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm px-3">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!allHandled}
            className={`${allHandled ? 'bg-[#324c48] hover:bg-[#3f4f24]' : 'bg-gray-400'} text-white`}
          >
            {allHandled ? (
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Review
              </span>
            ) : (
              `Handle ${remainingCount} Remaining`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}