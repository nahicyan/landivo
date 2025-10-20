// components/PropertyManagement/FeaturedPropertiesManager.jsx
import React, { useState, useEffect } from "react";
import { getPropertyRows } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { Loader2, GripVertical, Save } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { updatePropertyRow } from "@/utils/api";

// Sortable item component
const SortableItem = ({id, title, address, position}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center bg-white border rounded-md p-3 shadow-sm"
    >
      <div {...attributes} {...listeners} className="mr-3 text-gray-400 cursor-grab">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-[#324c48] truncate">{title}</p>
          <span className="ml-2 text-sm text-gray-500">Position {position}</span>
        </div>
        <p className="text-sm text-gray-500 truncate">{address}</p>
      </div>
    </div>
  );
};

export function FeaturedPropertiesManager() {
  const [propertyRows, setPropertyRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Set up sensors for drag operations
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchPropertyRows();
  }, []);

  const fetchPropertyRows = async () => {
    try {
      setLoading(true);
      const rows = await getPropertyRows();
      setPropertyRows(rows);
      
      // If there's a featured row, select it by default
      const featuredRow = rows.find(row => row.rowType === 'featured');
      if (featuredRow) {
        setSelectedRow(featuredRow.id);
        fetchRowProperties(featuredRow.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching property rows:", error);
      toast.error("Failed to load property rows");
      setLoading(false);
    }
  };

  const fetchRowProperties = async (rowId) => {
    try {
      setLoading(true);
      const response = await getPropertyRows(`?rowId=${rowId}`);
      
      if (response && response.propertyDetails) {
        setProperties(response.propertyDetails);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching row properties:", error);
      toast.error("Failed to load row properties");
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (rowId) => {
    setSelectedRow(rowId);
    fetchRowProperties(rowId);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setProperties((items) => {
        // Find indices
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        // Return reordered array
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    if (!selectedRow || properties.length === 0) return;
    
    try {
      setIsSaving(true);
      
      // Update the property row's display order
      const updatedOrder = properties.map(property => property.id);
      
      await updatePropertyRow(selectedRow, { displayOrder: updatedOrder });
      
      toast.success("Display order updated successfully");
    } catch (error) {
      console.error("Error saving display order:", error);
      toast.error("Failed to save display order");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#324c48]" />
        <span className="ml-2 text-[#324c48]">Loading featured properties...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-64">
          <Select
            value={selectedRow || ""}
            onValueChange={handleRowChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a property row" />
            </SelectTrigger>
            <SelectContent>
              {propertyRows.map(row => (
                <SelectItem key={row.id} value={row.id}>
                  {row.name || row.rowType || "Unnamed Row"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={saveOrder} 
          disabled={!selectedRow || isSaving || properties.length === 0}
          className="bg-[#324c48] hover:bg-[#3f4f24]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Order
            </>
          )}
        </Button>
      </div>
      
      {!selectedRow ? (
        <div className="text-center p-8 bg-gray-50 border rounded-md">
          <p className="text-gray-500">Please select a property row to manage</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 border rounded-md">
          <p className="text-gray-500">No properties in this row</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Drag to Reorder Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext 
                items={properties.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {properties.map((property, index) => (
                    <SortableItem
                      key={property.id}
                      id={property.id}
                      title={property.title}
                      address={`${property.streetAddress}, ${property.city}, ${property.state}`}
                      position={index + 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}
    </div>
  );
}