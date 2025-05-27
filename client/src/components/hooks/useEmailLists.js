import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getEmailLists,
  getEmailList,
  createEmailList,
  updateEmailList,
  deleteEmailList,
  addBuyersToList as addBuyersApi,
  removeBuyersFromList as removeBuyersApi,
  sendEmailToList
} from "@/utils/api";

export function useEmailLists() {
  const [lists, setLists] = useState([]);
  const [filteredLists, setFilteredLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
  });

  // Function to fetch lists
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmailLists();
      setLists(data);
      setFilteredLists(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching email lists:", err);
      setError("Failed to load email lists");
      toast.error("Failed to load email lists");
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refetch lists
  const refetchLists = useCallback(async () => {
    await fetchLists();
  }, [fetchLists]);

  // Fetch all email lists on mount
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Apply filters when filters or lists change
  useEffect(() => {
    if (!lists.length) return;

    let result = [...lists];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(list =>
        list.name.toLowerCase().includes(searchTerm) ||
        (list.description && list.description.toLowerCase().includes(searchTerm)) ||
        (list.criteria?.areas && list.criteria.areas.some(area =>
          area.toLowerCase().includes(searchTerm)
        )) ||
        (list.criteria?.buyerTypes && list.criteria.buyerTypes.some(type =>
          type.toLowerCase().includes(searchTerm)
        ))
      );
    }

    setFilteredLists(result);
  }, [lists, filters]);

  // Create a new list
  const createList = async (listData) => {
    try {
      const response = await createEmailList(listData);
      setLists(prev => [...prev, response.list]);
      toast.success("Buyer list created successfully!");
      return response.list;
    } catch (err) {
      console.error("Error creating email list:", err);
      toast.error("Failed to create email list");
      throw err;
    }
  };

  // Update an existing list
  const updateList = async (listId, listData) => {
    try {
      const response = await updateEmailList(listId, listData);
      setLists(prev =>
        prev.map(list => list.id === listId ? response.list : list)
      );
      toast.success("Buyer list updated successfully!");
      return response.list;
    } catch (err) {
      console.error("Error updating email list:", err);
      toast.error("Failed to update email list");
      throw err;
    }
  };

  // Delete a list
  const deleteList = async (listId, deleteBuyers = false) => {
    try {
      await deleteEmailList(listId, deleteBuyers);
      toast.success("Email list deleted successfully");
      refetchLists();
    } catch (error) {
      toast.error("Failed to delete email list");
      throw error;
    }
  };

  // Add buyers to a list
  const addBuyersToList = async (listId, buyerIds) => {
    try {
      await addBuyersApi(listId, buyerIds);

      // Update the buyer count in the list
      setLists(prev =>
        prev.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              buyerCount: (list.buyerCount || 0) + buyerIds.length
            };
          }
          return list;
        })
      );

      toast.success(`${buyerIds.length} buyers added to list!`);
    } catch (err) {
      console.error("Error adding buyers to list:", err);
      toast.error("Failed to add buyers to list");
      throw err;
    }
  };

  // Remove buyers from a list
  const removeBuyersFromList = async (listId, buyerIds) => {
    try {
      await removeBuyersApi(listId, buyerIds);

      // Update the buyer count in the list
      setLists(prev =>
        prev.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              buyerCount: Math.max(0, (list.buyerCount || 0) - buyerIds.length)
            };
          }
          return list;
        })
      );

      toast.success(`${buyerIds.length} buyers removed from list!`);
    } catch (err) {
      console.error("Error removing buyers from list:", err);
      toast.error("Failed to remove buyers from list");
      throw err;
    }
  };

  // Send email to list
  const sendEmail = async (listId, emailData) => {
    try {
      await sendEmailToList(listId, emailData);

      // Update the last email date
      setLists(prev =>
        prev.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              lastEmailDate: new Date().toISOString()
            };
          }
          return list;
        })
      );

      toast.success("Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email");
      throw err;
    }
  };

  // Get list members
  const getListMembers = async (listId) => {
    try {
      const listData = await getEmailList(listId);
      return listData.buyers || [];
    } catch (err) {
      console.error("Error fetching list members:", err);
      toast.error("Failed to fetch list members");
      throw err;
    }
  };

  return {
    lists,
    filteredLists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    addBuyersToList,
    removeBuyersFromList,
    sendEmail,
    getListMembers,
    refetchLists,
    setListFilters: setFilters
  };
}