// client/src/components/ImageUploadPreview/ImageUploadPreview.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Trash2, ImageIcon, Move, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sortable image item
const SortableImage = ({ image, index, onDelete, type }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: image.id || `${type}-${index}`,
    data: { type, index, image }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const preview = type === 'existing' 
    ? `${import.meta.env.VITE_SERVER_URL}/${image.path}`
    : image.preview;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm",
        isDragging ? "z-10 ring-2 ring-primary" : ""
      )}
    >
      <img 
        src={preview} 
        alt={`Property image ${index + 1}`} 
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200">
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        >
          <Move size={16} />
        </div>

        <button
          type="button"
          onClick={() => onDelete(index, type)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X size={16} />
        </button>

        {index === 0 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium px-2 py-1 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            Main Image
          </div>
        )}
      </div>
    </div>
  );
};

// Draggable image for drag overlay
const DraggableImage = ({ image }) => {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary bg-white shadow-md">
      <img 
        src={image.preview || `${import.meta.env.VITE_SERVER_URL}/${image.path}`}
        alt="Dragging" 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Main component
const ImageUploadPreview = ({ 
  existingImages = [], 
  newImages = [], 
  onExistingChange, 
  onNewChange,
  maxImages = 30
}) => {
  // Local state for existing images with IDs
  const [existingItems, setExistingItems] = useState([]);
  
  // State for upload errors
  const [uploadError, setUploadError] = useState(null);
  
  // Initialize existing images with IDs when component mounts or existingImages changes
  useEffect(() => {
    setExistingItems(
      existingImages.map((path, index) => ({
        id: `existing-${index}`,
        path,
        index
      }))
    );
  }, [existingImages]);

  // Local state for new images with previews
  const [newItems, setNewItems] = useState([]);
  
  // Update new items when newImages change
  useEffect(() => {
    // Cleanup old previews to prevent memory leaks
    newItems.forEach(item => {
      if (item.preview && typeof item.preview === 'string') {
        URL.revokeObjectURL(item.preview);
      }
    });
    
    // Create new previews
    setNewItems(
      newImages.map((file, index) => ({
        id: `new-${index}`,
        file,
        preview: URL.createObjectURL(file),
        index
      }))
    );
    
    // Cleanup function
    return () => {
      newItems.forEach(item => {
        if (item.preview && typeof item.preview === 'string') {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [newImages]);

  // Active drag item state
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Allowed file extensions
  const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  
  // Validate file extension
  const isValidFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension);
  };

  // Dropzone configuration - UPDATED to only accept specific formats
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Clear previous errors
    setUploadError(null);
    
    // Filter files by extension as an extra layer of validation
    const validFiles = acceptedFiles.filter(file => {
      if (!isValidFileType(file)) {
        return false;
      }
      return true;
    });
    
    const invalidFiles = acceptedFiles.filter(file => !isValidFileType(file));
    
    // Handle rejected or invalid files
    if (rejectedFiles.length > 0 || invalidFiles.length > 0) {
      setUploadError(`Only JPEG, JPG, PNG, WEBP, and GIF images are allowed.`);
      return;
    }
    
    // Check if adding these files would exceed maxImages
    if (existingItems.length + newItems.length + validFiles.length > maxImages) {
      setUploadError(`You can only upload a maximum of ${maxImages} images`);
      return;
    }
    
    // Process and add new files
    const updatedNewImages = [...newImages, ...validFiles];
    onNewChange(updatedNewImages);
  }, [existingItems.length, newItems.length, newImages, onNewChange, maxImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    maxSize: 20971520, // 20MB
    disabled: existingItems.length + newItems.length >= maxImages
  });

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the dragged item
    const { data } = active;
    setActiveItem(data.current.image);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    if (active.id !== over.id) {
      // Get data about dragged and target items
      const activeData = active.data.current;
      const overData = over.data.current;
      
      // Only allow reordering within the same type (existing or new)
      if (activeData.type === overData.type) {
        if (activeData.type === 'existing') {
          // Reorder existing images
          setExistingItems(items => {
            const oldIndex = activeData.index;
            const newIndex = overData.index;
            
            const newArray = arrayMove(items, oldIndex, newIndex);
            
            // Update parent component
            onExistingChange(newArray.map(item => item.path));
            
            return newArray;
          });
        } else {
          // Reorder new images
          setNewItems(items => {
            const oldIndex = activeData.index;
            const newIndex = overData.index;
            
            const newArray = arrayMove(items, oldIndex, newIndex);
            
            // Update parent component
            onNewChange(newArray.map(item => item.file));
            
            return newArray;
          });
        }
      }
    }
    
    setActiveId(null);
    setActiveItem(null);
  };

  // Delete an image
  const handleDelete = (index, type) => {
    if (type === 'existing') {
      const updatedItems = [...existingItems];
      updatedItems.splice(index, 1);
      
      setExistingItems(updatedItems);
      onExistingChange(updatedItems.map(item => item.path));
    } else {
      // Revoke object URL before removing
      if (newItems[index]?.preview) {
        URL.revokeObjectURL(newItems[index].preview);
      }
      
      const updatedItems = [...newItems];
      updatedItems.splice(index, 1);
      
      setNewItems(updatedItems);
      onNewChange(updatedItems.map(item => item.file));
    }
  };

  // Clear all images
  const handleClearAll = () => {
    // Cleanup object URLs
    newItems.forEach(item => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
    
    setExistingItems([]);
    setNewItems([]);
    onExistingChange([]);
    onNewChange([]);
  };

  // Total image count
  const totalImages = existingItems.length + newItems.length;
  const canAddMore = totalImages < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-600 font-medium">
          {totalImages} of {maxImages} images
        </span>
        
        <div className="flex gap-2">
          {totalImages > 0 && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleClearAll}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 font-medium">{uploadError}</p>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-xs text-red-500 hover:text-red-700 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/70",
          !canAddMore && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="font-medium text-primary">Drop the images here</p>
          ) : (
            <>
              <p className="font-medium text-gray-700">
                Drag & drop images here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {canAddMore
                  ? `You can add ${maxImages - totalImages} more image${
                      maxImages - totalImages !== 1 ? "s" : ""
                    }`
                  : "Maximum number of images reached"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: JPEG, JPG, PNG, WEBP, GIF (Max 20MB each)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image grids with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Display existing images if any */}
        {existingItems.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h4>
            
            <SortableContext
              items={existingItems.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {existingItems.map((image, index) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    index={index}
                    onDelete={handleDelete}
                    type="existing"
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}

        {/* Display new images if any */}
        {newItems.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
            
            <SortableContext
              items={newItems.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {newItems.map((image, index) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    index={index}
                    onDelete={handleDelete}
                    type="new"
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}
        
        {/* Dragging overlay */}
        <DragOverlay adjustScale={true}>
          {activeId ? (
            <div className="h-24 w-24">
              {activeItem && <DraggableImage image={activeItem} />}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Help text */}
      {totalImages > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Drag to reorder images. The first image will be used as the main property image.
        </p>
      )}
    </div>
  );
};

export default ImageUploadPreview;