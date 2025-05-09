// components/PropertyManagement/PropertyRowManager.jsx
import React, { useState, useEffect } from "react";
import { getPropertyRows, getProperty } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-toastify";
import { Loader2, Plus, Edit, Trash } from "lucide-react";
import axios from "axios";

export function PropertyRowManager() {
  const [propertyRows, setPropertyRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newRowData, setNewRowData] = useState({
    name: "",
    rowType: "",
    sort: "manual",
    displayOrder: []
  });
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchPropertyRows();
  }, []);

  const fetchPropertyRows = async () => {
    try {
      setLoading(true);
      const data = await getPropertyRows();
      setPropertyRows(data);
    } catch (error) {
      console.error("Error fetching property rows:", error);
      toast.error("Failed to load property rows");
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDetails = async (propertyIds) => {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        setProperties([]);
        return;
      }

      const propertyPromises = propertyIds.map(id => getProperty(id));
      const propertyResults = await Promise.all(propertyPromises);
      setProperties(propertyResults.filter(p => p && p.id));
    } catch (error) {
      console.error("Error fetching property details:", error);
      toast.error("Failed to load property details");
    }
  };

  const handleRowSelect = (row) => {
    setSelectedRow(row);
    fetchPropertyDetails(row.displayOrder);
  };

  const handleCreateRow = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/property-rows`, newRowData);
      toast.success("Property row created successfully");
      setNewRowData({
        name: "",
        rowType: "",
        sort: "manual",
        displayOrder: []
      });
      setIsCreating(false);
      fetchPropertyRows();
    } catch (error) {
      console.error("Error creating property row:", error);
      toast.error("Failed to create property row");
    }
  };

  const handleUpdateRow = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/property-rows/${selectedRow.id}`, newRowData);
      toast.success("Property row updated successfully");
      setIsEditing(false);
      fetchPropertyRows();
    } catch (error) {
      console.error("Error updating property row:", error);
      toast.error("Failed to update property row");
    }
  };

  const handleDeleteRow = async (rowId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/property-rows/${rowId}`);
      toast.success("Property row deleted successfully");
      if (selectedRow && selectedRow.id === rowId) {
        setSelectedRow(null);
        setProperties([]);
      }
      fetchPropertyRows();
    } catch (error) {
      console.error("Error deleting property row:", error);
      toast.error("Failed to delete property row");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#324c48]" />
        <span className="ml-2">Loading property rows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#324c48]">Property Rows</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-[#324c48]">
              <Plus className="w-4 h-4 mr-2" /> Create Row
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Property Row</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="row-name">Row Name</Label>
                <Input
                  id="row-name"
                  value={newRowData.name}
                  onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                  placeholder="e.g., Featured Properties"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="row-type">Row Type</Label>
                <Input
                  id="row-type"
                  value={newRowData.rowType}
                  onChange={(e) => setNewRowData({ ...newRowData, rowType: e.target.value })}
                  placeholder="e.g., featured"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-method">Sort Method</Label>
                <Select
                  value={newRowData.sort}
                  onValueChange={(value) => setNewRowData({ ...newRowData, sort: value })}
                >
                  <SelectTrigger id="sort-method">
                    <SelectValue placeholder="Select sort method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreateRow} className="bg-[#324c48]">Create Row</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-[#f4f7ee] border-b">
            <h3 className="font-medium text-[#3f4f24]">All Property Rows</h3>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {propertyRows.length === 0 ? (
              <p className="text-center p-4 text-gray-500">No property rows found</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {propertyRows.map((row) => (
                  <li 
                    key={row.id} 
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedRow?.id === row.id ? 'bg-[#f0f5f4]' : ''}`}
                    onClick={() => handleRowSelect(row)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#324c48]">{row.name || 'Unnamed Row'}</p>
                        <p className="text-sm text-gray-500">Type: {row.rowType || 'No type'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setNewRowData(row);
                        }}>
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(row.id);
                        }}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden col-span-2">
          <div className="p-4 bg-[#f0f5f4] border-b">
            <h3 className="font-medium text-[#324c48]">
              {selectedRow 
                ? `Properties in ${selectedRow.name || 'Selected Row'}`
                : 'Select a row to view properties'
              }
            </h3>
          </div>
          <div className="p-4">
            {!selectedRow ? (
              <p className="text-center p-8 text-gray-500">Select a row to view its properties</p>
            ) : selectedRow.displayOrder.length === 0 ? (
              <p className="text-center p-8 text-gray-500">No properties in this row</p>
            ) : (
              <Table>
                <TableCaption>Properties in display order</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Position</TableHead>
                    <TableHead>Property ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property, index) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{property.id}</TableCell>
                      <TableCell>{property.title}</TableCell>
                      <TableCell>
                        {property.streetAddress}, {property.city}, {property.state}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property Row</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-row-name">Row Name</Label>
              <Input
                id="edit-row-name"
                value={newRowData.name}
                onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-row-type">Row Type</Label>
              <Input
                id="edit-row-type"
                value={newRowData.rowType}
                onChange={(e) => setNewRowData({ ...newRowData, rowType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sort-method">Sort Method</Label>
              <Select
                value={newRowData.sort}
                onValueChange={(value) => setNewRowData({ ...newRowData, sort: value })}
              >
                <SelectTrigger id="edit-sort-method">
                  <SelectValue placeholder="Select sort method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdateRow} className="bg-[#324c48]">Update Row</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}