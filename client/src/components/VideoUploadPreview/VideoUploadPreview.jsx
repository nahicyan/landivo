// client/src/components/VideoUploadPreview/VideoUploadPreview.jsx
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

import { Trash2, VideoIcon, Move, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sortable video item
const SortableVideo = ({ video, index, onDelete, type }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: video.id || `${type}-${index}`,
    data: { type, index, video }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const preview = type === 'existing' 
    ? `${import.meta.env.VITE_SERVER_URL}/${video.path}`
    : video.preview;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-black shadow-sm",
        isDragging ? "z-10 ring-2 ring-primary" : ""
      )}
    >
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <video 
          src={preview} 
          className="w-full h-full object-cover"
          muted
          onMouseOver={(e) => e.target.play()}
          onMouseOut={(e) => {e.target.pause(); e.target.currentTime = 0;}}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 rounded-full p-3">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

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
            Main Video
          </div>
        )}
      </div>
    </div>
  );
};

// Draggable video for drag overlay
const DraggableVideo = ({ video }) => {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary bg-black shadow-md">
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <VideoIcon className="w-12 h-12 text-white opacity-70" />
      </div>
    </div>
  );
};

// Main component
const VideoUploadPreview = ({ 
  existingVideos = [], 
  newVideos = [], 
  onExistingChange, 
  onNewChange,
  maxVideos = 5
}) => {
  // Local state for existing videos with IDs
  const [existingItems, setExistingItems] = useState([]);
  
  // Initialize existing videos with IDs when component mounts or existingVideos changes
  useEffect(() => {
    setExistingItems(
      existingVideos.map((path, index) => ({
        id: `existing-${index}`,
        path,
        index
      }))
    );
  }, [existingVideos]);

  // Local state for new videos with previews
  const [newItems, setNewItems] = useState([]);
  
  // Update new items when newVideos change
  useEffect(() => {
    // Cleanup old previews to prevent memory leaks
    newItems.forEach(item => {
      if (item.preview && typeof item.preview === 'string') {
        URL.revokeObjectURL(item.preview);
      }
    });
    
    // Create new previews
    setNewItems(
      newVideos.map((file, index) => ({
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
  }, [newVideos]);

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

  // Dropzone configuration
  const onDrop = useCallback(acceptedFiles => {
    // Check if adding these files would exceed maxVideos
    if (existingItems.length + newItems.length + acceptedFiles.length > maxVideos) {
      alert(`You can only upload a maximum of ${maxVideos} videos`);
      return;
    }
    
    // Process and add new files
    const updatedNewVideos = [...newVideos, ...acceptedFiles];
    onNewChange(updatedNewVideos);
  }, [existingItems.length, newItems.length, newVideos, onNewChange, maxVideos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': []
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: existingItems.length + newItems.length >= maxVideos
  });

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the dragged item
    const { data } = active;
    setActiveItem(data.current.video);
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
          // Reorder existing videos
          setExistingItems(items => {
            const oldIndex = activeData.index;
            const newIndex = overData.index;
            
            const newArray = arrayMove(items, oldIndex, newIndex);
            
            // Update parent component
            onExistingChange(newArray.map(item => item.path));
            
            return newArray;
          });
        } else {
          // Reorder new videos
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

  // Delete a video
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

  // Clear all videos
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

  // Total video count
  const totalVideos = existingItems.length + newItems.length;
  const canAddMore = totalVideos < maxVideos;

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-600 font-medium">
          {totalVideos} of {maxVideos} videos
        </span>
        
        <div className="flex gap-2">
          {totalVideos > 0 && (
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
          <VideoIcon className="h-12 w-12 text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="font-medium text-primary">Drop the videos here</p>
          ) : (
            <>
              <p className="font-medium text-gray-700">
                Drag & drop videos here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {canAddMore
                  ? `You can add ${maxVideos - totalVideos} more video${
                      maxVideos - totalVideos !== 1 ? "s" : ""
                    }`
                  : "Maximum number of videos reached"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports MP4, WebM, MOV, AVI. Max 100MB per file.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Video grids with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Display existing videos if any */}
        {existingItems.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Videos</h4>
            
            <SortableContext
              items={existingItems.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {existingItems.map((video, index) => (
                  <SortableVideo
                    key={video.id}
                    video={video}
                    index={index}
                    onDelete={handleDelete}
                    type="existing"
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}

        {/* Display new videos if any */}
        {newItems.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">New Videos</h4>
            
            <SortableContext
              items={newItems.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {newItems.map((video, index) => (
                  <SortableVideo
                    key={video.id}
                    video={video}
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
              {activeItem && <DraggableVideo video={activeItem} />}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Help text */}
      {totalVideos > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Drag to reorder videos. The first video will be used as the main property video.
        </p>
      )}
    </div>
  );
};

export default VideoUploadPreview;