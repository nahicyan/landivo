import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { PuffLoader } from "react-spinners";
import { toast } from "react-toastify";
import { api } from "@/utils/api";

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

  // Handle creating a list (updated to handle imported buyers with duplicate actions)
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

        // Step 1: Import new buyers first
        if (newBuyers.length > 0) {
          const importResponse = await api.post('/buyer/import', {
            buyers: newBuyers,
            source: 'CSV Import'
          });

          const createdBuyerIds = importResponse.data.results?.createdBuyerIds || [];
          allBuyerIds.push(...createdBuyerIds);

          console.log(`Created ${createdBuyerIds.length} new buyers`);
        }

        // Step 2: Create the email list first (needed for replace/update actions)
        const createResponse = await createList({
          ...listData,
          buyerIds: [],
          criteria: {}
        });
        const newList = createResponse.list || createResponse;
        // Step 3: Process duplicate actions
        for (const duplicate of duplicatesWithActions) {
          const existingBuyerId = duplicate.existingBuyerId;
          const action = duplicate.action;

          if (!existingBuyerId) {
            console.warn('Skipping duplicate without existingBuyerId:', duplicate);
            continue;
          }

          try {
            // Prepare update data - only include fields that have values and filter out undefined
            const updateData = {};

            // Always include email (required by backend)
            if (duplicate.email) {
              updateData.email = duplicate.email;
            } else {
              // If no email in CSV data, get it from the original buyer
              updateData.email = duplicate.originalBuyer?.email;
            }

            // Only include other fields if they have actual values
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

            // Update the existing buyer with new CSV data (only if we have meaningful updates)
            if (Object.keys(updateData).length > 1) { // More than just email
              console.log(`Updating buyer ${existingBuyerId} with data:`, updateData);
              await api.put(`/buyer/update/${existingBuyerId}`, updateData);
            }

            // Handle list membership based on action
            if (action === 'update') {
              // Add to new list while keeping on existing lists
              await addBuyersToListFn(newList.id, [existingBuyerId]);
              allBuyerIds.push(existingBuyerId);

            } else if (action === 'replace') {
              // Remove from all existing lists, then add to new list

              // Get the buyer's current list memberships from the original buyer data
              const currentListIds = duplicate.originalBuyer?.emailListMemberships?.map(m => m.emailListId) || [];

              // Remove from all current lists
              for (const listId of currentListIds) {
                try {
                  await removeBuyersFromList(listId, [existingBuyerId]);
                  console.log(`Removed buyer ${existingBuyerId} from list ${listId}`);
                } catch (error) {
                  console.warn(`Failed to remove buyer ${existingBuyerId} from list ${listId}:`, error);
                }
              }

              // Add to new list
              await addBuyersToListFn(newList.id, [existingBuyerId]);
              allBuyerIds.push(existingBuyerId);
            }
            // For 'skip' action, we don't add the buyer to any list

          } catch (error) {
            console.error(`Error processing duplicate buyer ${existingBuyerId}:`, error);

            // Log more details about the error
            if (error.response) {
              console.error('Response data:', error.response.data);
              console.error('Response status:', error.response.status);
              console.error('Response headers:', error.response.headers);
            }

            toast.warning(`Failed to process buyer: ${duplicate.firstName || 'Unknown'} ${duplicate.lastName || 'Unknown'} - ${error.response?.data?.message || error.message}`);
          }
        }

        // Step 4: Show success message
        const totalProcessed = allBuyerIds.length;
        const skippedCount = duplicatesWithActions.filter(d => d.action === 'skip').length;

        if (totalProcessed > 0) {
          toast.success(
            `List "${listData.name}" created successfully with ${totalProcessed} buyers` +
            (skippedCount > 0 ? ` (${skippedCount} duplicates were skipped)` : '')
          );
        } else if (skippedCount > 0) {
          toast.info(`List "${listData.name}" created, but all ${skippedCount} buyers were skipped due to duplicate handling`);
        } else {
          toast.warning("List created but no buyers were added");
        }

        // Clear imported buyers
        setImportedBuyers(null);

        // Refresh data
        await refetchLists();
        // await refetchBuyers(); // needs to remain disabled

      } else {
        // Create list without imported buyers (normal flow)
        await createList(listData);
      }
    } catch (error) {
      console.error("Error creating list:", error);

      // Log more details about the error
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }

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