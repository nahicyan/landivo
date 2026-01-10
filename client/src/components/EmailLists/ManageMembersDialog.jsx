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
  Search, 
  //Removed: UserPlus, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { toast } from "react-toastify";
import { getEmailList } from "@/utils/api";

export default function ManageMembersDialog({ 
  open, 
  onOpenChange, 
  selectedList,
  onRemoveMembers,
  //Removed: onAddBuyers 
}) {
  // State for members and pagination
  const [listMembers, setListMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage] = useState(10);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Fetch list members when dialog opens
  useEffect(() => {
    const fetchMembers = async () => {
      if (!open || !selectedList) return;

      try {
        setLoading(true);
        const listData = await getEmailList(selectedList.id);
        
        if (listData && listData.buyers) {
          setListMembers(listData.buyers);
          setFilteredMembers(listData.buyers);
        } else {
          setListMembers([]);
          setFilteredMembers([]);
        }
      } catch (error) {
        console.error("Error fetching list members:", error);
        toast.error("Failed to load list members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [open, selectedList]);

  // Filter members when search query changes
  useEffect(() => {
    if (!listMembers.length) return;
    
    if (!memberSearchQuery.trim()) {
      setFilteredMembers(listMembers);
      setCurrentPage(1);
      return;
    }
    
    const query = memberSearchQuery.toLowerCase();
    const filtered = listMembers.filter(buyer => 
      buyer.firstName.toLowerCase().includes(query) ||
      buyer.lastName.toLowerCase().includes(query) ||
      buyer.email.toLowerCase().includes(query) ||
      buyer.phone.includes(query)
    );
    
    setFilteredMembers(filtered);
    setCurrentPage(1);
  }, [listMembers, memberSearchQuery]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMemberSearchQuery("");
      setSelectedMembers([]);
      setCurrentPage(1);
    }
  }, [open]);

  // Handle selecting/deselecting a member
  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Handle selecting/deselecting all visible members
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMembers(currentMembers.map(member => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  // Handle removing selected members
  const handleRemoveMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.error("No members selected");
      return;
    }

    try {
      await onRemoveMembers(selectedMembers);
      
      // Update local state
      setListMembers(prev => 
        prev.filter(member => !selectedMembers.includes(member.id))
      );
      setFilteredMembers(prev => 
        prev.filter(member => !selectedMembers.includes(member.id))
      );
      setSelectedMembers([]);
      
      // Adjust current page if necessary
      const newTotalPages = Math.ceil((filteredMembers.length - selectedMembers.length) / membersPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      toast.success(`${selectedMembers.length} members removed from list`);
    } catch (error) {
      console.error("Remove members error:", error);
    }
  };

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage List Members</DialogTitle>
          <DialogDescription>
            {selectedList && (
              <>
                View and manage buyers in the {selectedList.name} list.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="pl-9 border-[#324c48]/30"
              />
            </div>
            
            {/* Removed: Button to Add Buyers */}
            {/* <Button
              variant="outline"
              size="sm"
              className="border-[#324c48] text-[#324c48]"
              onClick={onAddBuyers}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Buyers
            </Button> */}
          </div>
          
          {selectedMembers.length > 0 && (
            <div className="bg-[#f0f5f4] mb-4 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-[#324c48]">
                {selectedMembers.length} members selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-red-600"
                  onClick={handleRemoveMembers}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setSelectedMembers([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedMembers.length > 0 && selectedMembers.length === currentMembers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Areas</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading list members...
                    </TableCell>
                  </TableRow>
                ) : currentMembers.length > 0 ? (
                  currentMembers.map((buyer) => (
                    <TableRow key={buyer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.includes(buyer.id)}
                          onCheckedChange={() => handleSelectMember(buyer.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {buyer.firstName} {buyer.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{buyer.email}</div>
                        <div className="text-xs text-gray-500">{buyer.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${buyer.buyerType === 'CashBuyer' ? 'bg-green-100 text-green-800' : ''}
                            ${buyer.buyerType === 'Investor' ? 'bg-blue-100 text-blue-800' : ''}
                            ${buyer.buyerType === 'Realtor' ? 'bg-purple-100 text-purple-800' : ''}
                            ${buyer.buyerType === 'Builder' ? 'bg-orange-100 text-orange-800' : ''}
                            ${buyer.buyerType === 'Developer' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${buyer.buyerType === 'Wholesaler' ? 'bg-indigo-100 text-indigo-800' : ''}
                          `}
                        >
                          {buyer.buyerType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {buyer.preferredAreas && buyer.preferredAreas.map((area, idx) => (
                            <Badge key={idx} variant="outline" className="bg-[#f0f5f4] text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {buyer.source === 'VIP Buyers List' ? (
                          <Badge className="bg-[#D4A017] text-white">VIP</Badge>
                        ) : (
                          buyer.source
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {memberSearchQuery
                        ? "No members match your search."
                        : "This list has no members yet. Click 'Add Buyers' to add some."}
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} members
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
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}