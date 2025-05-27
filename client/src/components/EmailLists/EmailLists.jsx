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

  // Handle creating a list (updated to handle imported buyers)
  const handleCreateList = async (listData) => {
    try {
      if (importedBuyers && importedBuyers.length > 0) {
        // Import buyers first
        const importResponse = await api.post('/buyer/import', {
          buyers: importedBuyers,
          source: 'CSV Import'
        });
        
        console.log('Import response:', importResponse.data); // Debug log
        
        // Get the created buyer IDs from the response
        const createdBuyerIds = importResponse.data.results.createdBuyerIds || [];
        
        if (createdBuyerIds.length === 0) {
          toast.warning("No new buyers were created - they may already exist in the system");
          return;
        }
        
        // Create the list with only the imported buyer IDs
        await createList({
          ...listData,
          buyerIds: createdBuyerIds,
          // Don't include criteria that would match all buyers
          criteria: {}
        });
        
        toast.success(`List created with ${createdBuyerIds.length} imported buyers`);
        setImportedBuyers(null);
        // await refetchBuyers(); // Troubleshooting
      } else {
        // Create list without imported buyers
        await createList(listData);
      }
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
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