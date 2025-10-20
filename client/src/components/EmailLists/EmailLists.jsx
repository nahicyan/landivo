import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { PuffLoader } from "react-spinners";
import { toast } from "react-toastify";
import { importBuyers, updateBuyer, removeBuyersFromList as removeBuyersApi } from "@/utils/api";

// Import core components for email lists
import EmailListsTable from "./EmailListsTable";
import CreateListForm from "./CreateListForm";
import EditListForm from "./EditListForm";
import EmailForm from "./EmailForm";
import AddBuyersDialog from "./AddBuyersDialog";
import ManageMembersDialog from "./ManageMembersDialog";
import ImportCsvDialog from "./ImportCsvDialog";
import DeleteListConfirmDialog from "./DeleteListConfirmDialog";

// Import custom hooks from the proper location
import { useEmailLists } from "@/components/hooks/useEmailLists";
import useBuyers from "@/components/hooks/useBuyers.js";

export default function EmailLists() {
  // State for dialogs and selected list
  const [createListOpen, setCreateListOpen] = useState(false);
  const [editListOpen, setEditListOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [addBuyersOpen, setAddBuyersOpen] = useState(false);
  const [manageBuyersOpen, setManageBuyersOpen] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add state for imported buyers
  const [importedBuyers, setImportedBuyers] = useState(null);

  // Use custom hooks for data fetching and management
  const {
    lists,
    filteredLists,
    loading: listsLoading,
    createList,
    updateList,
    deleteList,
    sendEmail,
    addBuyersToList: addBuyersToListFn,
    removeBuyersFromList,
    setListFilters,
    refetchLists,
  } = useEmailLists();

  const {
    buyers,
    availableBuyers,
    loading: buyersLoading,
    refetchBuyers,
  } = useBuyers();

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setListFilters({ search: value });
  };

  // Handle opening the create list dialog
  const handleNewList = () => {
    setCreateListOpen(true);
  };

  // Handle opening the edit list dialog
  const handleEditList = (listId) => {
    const list = lists.find(l => l.id === listId);
    setSelectedList(list);
    setEditListOpen(true);
  };

  // Handle opening the email dialog
  const handleEmailList = (listId) => {
    const list = lists.find(l => l.id === listId);
    setSelectedList(list);
    setEmailDialogOpen(true);
  };

  // Handle opening the add buyers dialog
  const handleAddBuyers = (listId) => {
    const list = lists.find(l => l.id === listId);
    setSelectedList(list);
    setAddBuyersOpen(true);
  };

  // Handle opening the manage members dialog
  const handleManageMembers = (listId) => {
    const list = lists.find(l => l.id === listId);
    setSelectedList(list);
    setManageBuyersOpen(true);
  };

  // Handle delete list confirmation
  const handleDeleteList = (listId) => {
    const list = lists.find(l => l.id === listId);
    setListToDelete(list);
    setDeleteConfirmOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async (deleteBuyers) => {
    if (!listToDelete) return;

    try {
      await deleteList(listToDelete.id, deleteBuyers);
      setListToDelete(null);
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  // Handle CSV import
  const handleImportCsv = () => {
    setCsvUploadOpen(true);
  };

  // Handle clearing imported buyers
  const handleClearImportedBuyers = () => {
    setImportedBuyers(null);
  };

  const handleCreateList = async (listData) => {
    try {
      if (importedBuyers && importedBuyers.length > 0) {
        // Separate new buyers from duplicates with actions
        const newBuyers = importedBuyers.filter(buyer => !buyer.existingBuyerId);
        const duplicatesWithActions = importedBuyers.filter(buyer => buyer.existingBuyerId && buyer.action);

        console.log('Processing import:', {
          newBuyers: newBuyers.length,
          duplicatesWithActions: duplicatesWithActions.length
        });

        let allBuyerIds = [];
        let buyersToAddToNewList = []; // Batch buyer IDs for single API call
        let totalRemovedFromLists = 0; // Track total removals for single notification

        // Step 1: Import new buyers first using centralized API function
        if (newBuyers.length > 0) {
          try {
            const importResponse = await importBuyers(
              newBuyers.map(buyer => ({
                ...buyer,
                source: 'CSV Import',
                isNew: true
              })),
              'CSV Import'
            );

            const createdBuyerIds = importResponse.results?.createdBuyerIds || [];
            allBuyerIds.push(...createdBuyerIds);
            buyersToAddToNewList.push(...createdBuyerIds);

            console.log(`Created ${createdBuyerIds.length} new buyers`);
          } catch (error) {
            console.error('Error importing new buyers:', error);
            toast.error('Failed to import some buyers');
          }
        }

        // Step 2: Create the email list first (needed for replace/update actions)
        const createResponse = await createList({
          ...listData,
          buyerIds: buyersToAddToNewList,
          criteria: {}
        });
        
        const newList = createResponse.list || createResponse;
        const newListId = newList.id;

        if (!newListId) {
          throw new Error('Failed to get new list ID from response');
        }

        // Step 3: Process duplicate actions (batch operations)
        const updateBuyerIds = [];
        const replaceBuyerIds = [];
        const updatePromises = [];

        for (const duplicate of duplicatesWithActions) {
          const existingBuyerId = duplicate.existingBuyerId;
          const action = duplicate.action;

          if (!existingBuyerId) {
            console.warn('Skipping duplicate without existingBuyerId:', duplicate);
            continue;
          }

          try {
            // Prepare update data
            const updateData = {};

            if (duplicate.email) {
              updateData.email = duplicate.email;
            } else {
              updateData.email = duplicate.originalBuyer?.email;
            }

            if (duplicate.firstName && duplicate.firstName.trim()) {
              updateData.firstName = duplicate.firstName.trim();
            }
            if (duplicate.lastName && duplicate.lastName.trim()) {
              updateData.lastName = duplicate.lastName.trim();
            }
            if (duplicate.phone && duplicate.phone.trim()) {
              updateData.phone = duplicate.phone.trim();
            }
            if (duplicate.buyerType) {
              updateData.buyerType = duplicate.buyerType;
            }
            if (duplicate.preferredAreas && Array.isArray(duplicate.preferredAreas)) {
              updateData.preferredAreas = duplicate.preferredAreas;
            }
            if (duplicate.emailStatus) {
              updateData.emailStatus = duplicate.emailStatus;
            }
            if (duplicate.emailPermissionStatus) {
              updateData.emailPermissionStatus = duplicate.emailPermissionStatus;
            }

            // Queue update if we have meaningful changes using centralized API function
            if (Object.keys(updateData).length > 1) {
              console.log(`Updating buyer ${existingBuyerId} with data:`, updateData);
              updatePromises.push(updateBuyer(existingBuyerId, updateData));
            }

            // Batch buyer IDs based on action
            if (action === 'update') {
              updateBuyerIds.push(existingBuyerId);
              allBuyerIds.push(existingBuyerId);
            } else if (action === 'replace') {
              replaceBuyerIds.push(existingBuyerId);
              allBuyerIds.push(existingBuyerId);
            }

          } catch (error) {
            console.error(`Error processing duplicate buyer ${existingBuyerId}:`, error);
            toast.warning(`Failed to process buyer: ${duplicate.firstName || 'Unknown'} ${duplicate.lastName || 'Unknown'} - ${error.response?.data?.message || error.message}`);
          }
        }

        // Execute all buyer updates in parallel
        if (updatePromises.length > 0) {
          try {
            await Promise.all(updatePromises);
            console.log(`Updated ${updatePromises.length} buyers`);
          } catch (error) {
            console.error('Error updating some buyers:', error);
            toast.warning('Some buyer updates failed');
          }
        }

        // Handle 'replace' action: Remove from existing lists first (BATCHED)
        const allRemovalPromises = [];
        for (const buyerId of replaceBuyerIds) {
          const duplicate = duplicatesWithActions.find(d => d.existingBuyerId === buyerId);
          if (duplicate && duplicate.originalBuyer?.emailListMemberships) {
            const currentListIds = duplicate.originalBuyer.emailListMemberships.map(m => m.emailListId);
            totalRemovedFromLists += currentListIds.length; // Count total removals
            
            // Add removal promises to batch using centralized API function
            const removePromises = currentListIds.map(listId => 
              removeBuyersApi(listId, [buyerId])
                .catch(error => {
                  console.warn(`Failed to remove buyer ${buyerId} from list ${listId}:`, error);
                  totalRemovedFromLists--; // Adjust count for failed removals
                })
            );
            
            allRemovalPromises.push(...removePromises);
          }
        }

        // Execute all removals in parallel without individual notifications
        if (allRemovalPromises.length > 0) {
          try {
            await Promise.all(allRemovalPromises);
            console.log(`Removed ${replaceBuyerIds.length} buyers from ${totalRemovedFromLists} existing list memberships`);
          } catch (error) {
            console.warn('Some list removals failed:', error);
          }
        }

        // Step 4: Add all duplicate buyers to new list in single batch operation
        const allDuplicateBuyersToAdd = [...updateBuyerIds, ...replaceBuyerIds];
        
        if (allDuplicateBuyersToAdd.length > 0) {
          try {
            await addBuyersToListFn(newListId, allDuplicateBuyersToAdd);
            console.log(`Added ${allDuplicateBuyersToAdd.length} duplicate buyers to new list`);
          } catch (error) {
            console.error('Error adding duplicate buyers to list:', error);
            toast.error('Failed to add some duplicate buyers to the list');
          }
        }

        // Step 5: Show SINGLE success message with summary
        const totalProcessed = allBuyerIds.length;
        const skippedCount = duplicatesWithActions.filter(d => d.action === 'skip').length;

        if (allBuyerIds.length > 0 || skippedCount > 0) {
          let message = `List "${listData.name}" created successfully with ${allBuyerIds.length} buyers`;
          
          if (totalRemovedFromLists > 0) {
            message += `. Removed ${replaceBuyerIds.length} buyers from ${totalRemovedFromLists} existing list memberships`;
          }
          
          if (skippedCount > 0) {
            message += ` (${skippedCount} duplicates skipped)`;
          }
          
          toast.success(message);
        } else {
          toast.warning(`List "${listData.name}" created but no buyers were added`);
        }

        // Clear imported buyers
        setImportedBuyers(null);

        // Refresh data
        await refetchLists();

      } else {
        // Create list without imported buyers (normal flow)
        await createList(listData);
      }
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error(`Failed to create list: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  // Handle adding buyers to a list
  const handleAddBuyersToList = async (listId, buyerIds) => {
    try {
      await addBuyersToListFn(listId, buyerIds);
      setAddBuyersOpen(false);
    } catch (error) {
      console.error("Error adding buyers to list:", error);
    }
  };

  // Handle CSV import (updated to store imported buyers)
  const handleCsvImport = async (csvData, options) => {
    try {
      // Store the CSV data as imported buyers instead of immediately importing
      setImportedBuyers(csvData);
      toast.success(`${csvData.length} buyers ready to import`);
      setCsvUploadOpen(false);
    } catch (error) {
      toast.error('Failed to process CSV data');
      console.error('CSV processing error:', error);
    }
  };

  // Loading state
  if (listsLoading || buyersLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#3f4f24" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#324c48] mb-2">Email Lists</h1>
        <p className="text-gray-600">
          Create and manage lists of buyers grouped by area and type for targeted emails
        </p>
      </div>

      {/* Main Content */}
      <Card className="border-[#324c48]/20">
        {/* Table with search and actions */}
        <EmailListsTable
          lists={filteredLists}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onNewList={handleNewList}
          onEditList={handleEditList}
          onEmailList={handleEmailList}
          onAddBuyers={handleAddBuyers}
          onManageMembers={handleManageMembers}
          onDeleteList={handleDeleteList}
        />
      </Card>

      {/* Dialogs */}
      <CreateListForm
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        onCreateList={handleCreateList}
        onImportCsv={handleImportCsv}
        importedBuyers={importedBuyers}
        onClearImportedBuyers={handleClearImportedBuyers}
      />

      <EditListForm
        open={editListOpen}
        onOpenChange={setEditListOpen}
        selectedList={selectedList}
        onUpdateList={updateList}
        onImportCsv={handleImportCsv}
      />

      <EmailForm
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        selectedList={selectedList}
        onSendEmail={(emailData) => sendEmail(selectedList?.id, emailData)}
      />

      <AddBuyersDialog
        open={addBuyersOpen}
        onOpenChange={setAddBuyersOpen}
        selectedList={selectedList}
        availableBuyers={availableBuyers}
        onAddBuyers={(buyerIds) => handleAddBuyersToList(selectedList?.id, buyerIds)}
        onImportCsv={handleImportCsv}
      />

      <ManageMembersDialog
        open={manageBuyersOpen}
        onOpenChange={setManageBuyersOpen}
        selectedList={selectedList}
        onRemoveMembers={(buyerIds) => removeBuyersFromList(selectedList?.id, buyerIds)}
        onAddBuyers={() => setAddBuyersOpen(true)}
      />

      <ImportCsvDialog
        open={csvUploadOpen}
        onOpenChange={setCsvUploadOpen}
        existingLists={lists}
        onImport={handleCsvImport}
      />

      <DeleteListConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        selectedList={listToDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}