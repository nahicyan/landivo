// client/src/components/PropertyCarousel/PropertyCarousel.jsx
import React, { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Camera, Video, MapPin, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

// Image modal component (keeping existing implementation)
function ImageModal({ images, currentIndex, onClose, onNext, onPrev }) {
  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 bg-white/30 p-2 rounded hover:bg-white/50 transition"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Prev Arrow */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-full shadow hover:shadow-xl transition hidden sm:block"
        onClick={onPrev}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {/* Main Image */}
      <img
        src={images[currentIndex]}
        alt={`Zoomed ${currentIndex + 1}`}
        className="max-h-[80vh] object-contain mx-4"
        onClick={onClose}
      />

      {/* Next Arrow */}
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-full shadow hover:shadow-xl transition hidden sm:block"
        onClick={onNext}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      {/* Image count */}
      <span className="absolute bottom-4 left-4 text-sm bg-black/70 text-white px-4 py-2 rounded-full flex items-center space-x-2">
        <Camera className="w-4 h-4" />
        <span>
          {currentIndex + 1}/{images.length}
        </span>
      </span>
    </div>
  );
}

// Video modal component
function VideoModal({ video, onClose }) {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 bg-white/30 p-2 rounded hover:bg-white/50 transition"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Video Player */}
      <div className="max-h-[80vh] max-w-[90vw]">
        <video 
          src={video} 
          controls 
          autoPlay 
          className="max-h-[80vh] max-w-[90vw]"
        />
      </div>
    </div>
  );
}

export default function PropertyCarousel({ propertyData }) {
  // Content type state (images, videos, map, landId)
  const [contentType, setContentType] = useState('images');
  
  // Images state
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Videos state
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Load images
  useEffect(() => {
    if (propertyData?.imageUrls) {
      try {
        const parsedImages = Array.isArray(propertyData.imageUrls)
          ? propertyData.imageUrls
          : JSON.parse(propertyData.imageUrls);
        const fullUrls = parsedImages.map(
          (img) => `${import.meta.env.VITE_SERVER_URL}/${img}`
        );
        setImages(fullUrls);
      } catch (error) {
        console.error("Failed to parse image data:", error);
      }
    }
  }, [propertyData]);
  
  // Load videos
  useEffect(() => {
    if (propertyData?.videoUrls) {
      try {
        const parsedVideos = Array.isArray(propertyData.videoUrls)
          ? propertyData.videoUrls
          : JSON.parse(propertyData.videoUrls);
        const fullUrls = parsedVideos.map(
          (vid) => `${import.meta.env.VITE_SERVER_URL}/${vid}`
        );
        setVideos(fullUrls);
      } catch (error) {
        console.error("Failed to parse video data:", error);
      }
    }
  }, [propertyData]);

  // Navigation functions for images
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Navigation functions for videos
  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };
  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // Modal functions
  const openImageModal = () => setShowImageModal(true);
  const closeImageModal = () => setShowImageModal(false);
  const openVideoModal = () => setShowVideoModal(true);
  const closeVideoModal = () => setShowVideoModal(false);

  // Render the map component
  const renderMap = () => {
    if (propertyData.latitude && propertyData.longitude) {
      const googleMapsUrl = `https://www.google.com/maps?q=${propertyData.latitude},${propertyData.longitude}&output=embed`;
      return (
        <iframe 
          src={googleMapsUrl} 
          className="w-full h-full border-none" 
          allowFullScreen
        />
      );
    } else {
      const encodedAddress = encodeURIComponent(
        `${propertyData.streetAddress}, ${propertyData.city}, ${propertyData.state}`
      );
      const googleMapsUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
      return (
        <iframe 
          src={googleMapsUrl} 
          className="w-full h-full border-none" 
          allowFullScreen
        />
      );
    }
  };

  // Render the land ID component
  const renderLandId = () => {
    if (propertyData.landIdLink) {
      const embeddedLink = propertyData.landIdLink.replace("/share/", "/embed/");
      return (
        <iframe 
          src={embeddedLink} 
          className="w-full h-full border-none" 
          allowFullScreen
        />
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No Land ID information available</p>
          </div>
        </div>
      );
    }
  };

  // Check if we have content for each type
  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasMap = true; // Always show map option
  const hasLandId = !!propertyData.landIdLink;

  // Show a fallback message if no content is available
  if (!hasImages && !hasVideos && !hasLandId) {
    return (
      <div className="text-center text-gray-500 py-4">
        No media available for this property.
      </div>
    );
  }

  // NavTab component for styled tabs (from the good styling file)
  const NavTab = ({ active, onClick, icon, label }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-6 py-3 text-base font-medium transition-colors",
        active 
          ? "text-[#3f4f24] border-b-2 border-[#3f4f24]" 
          : "text-gray-600 hover:text-[#324c48]"
      )}
    >
      {React.cloneElement(icon, { 
        className: cn("mr-2 h-5 w-5", active ? "text-[#3f4f24]" : "text-gray-500") 
      })}
      {label}
    </button>
  );

  return (
    <div className="w-full">
      {/* Navigation Tabs - New design (from the good styling file) */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {hasImages && (
          <NavTab
            active={contentType === 'images'}
            onClick={() => setContentType('images')}
            icon={<Camera />}
            label="Images"
          />
        )}
        
        {hasVideos && (
          <NavTab
            active={contentType === 'videos'}
            onClick={() => setContentType('videos')}
            icon={<Video />}
            label="Video"
          />
        )}
        
        {hasMap && (
          <NavTab
            active={contentType === 'map'}
            onClick={() => setContentType('map')}
            icon={<Map />}
            label="Map"
          />
        )}
        
        {hasLandId && (
          <NavTab
            active={contentType === 'landId'}
            onClick={() => setContentType('landId')}
            icon={<MapPin />}
            label="Land ID"
          />
        )}
      </div>
      
      {/* Carousel Container with improved styling */}
      <div className="relative w-full overflow-hidden rounded-b-lg shadow-md">
        {/* AspectRatio component */}
        <AspectRatio ratio={16 / 9}>
          <div className="w-full h-full flex items-center justify-center">
            {/* Image Content */}
            {contentType === 'images' && hasImages && (
              <img
                src={images[currentImageIndex]}
                alt={`Slide ${currentImageIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={openImageModal}
              />
            )}
            
            {/* Video Content */}
            {contentType === 'videos' && hasVideos && (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <video 
                  src={videos[currentVideoIndex]}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={openVideoModal}
                  controls
                />
              </div>
            )}
            
            {/* Map Content */}
            {contentType === 'map' && (
              <div className="w-full h-full">
                {renderMap()}
              </div>
            )}
            
            {/* Land ID Content */}
            {contentType === 'landId' && (
              <div className="w-full h-full">
                {renderLandId()}
              </div>
            )}
          </div>
        </AspectRatio>

        {/* Controls for Images */}
        {contentType === 'images' && hasImages && (
          <>
            {/* Left/Right Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 text-gray-800 p-2 rounded-full shadow hover:bg-white transition"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 text-gray-800 p-2 rounded-full shadow hover:bg-white transition"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            {/* Image Counter - moved to bottom-right (from good styling) */}
            <div className="absolute bottom-4 right-4 z-10">
              <span className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>
          </>
        )}
        
        {/* Controls for Videos if multiple videos */}
        {contentType === 'videos' && hasVideos && videos.length > 1 && (
          <>
            <button
              onClick={prevVideo}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 text-gray-800 p-2 rounded-full shadow hover:bg-white transition"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={nextVideo}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 text-gray-800 p-2 rounded-full shadow hover:bg-white transition"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            {/* Video Counter - moved to bottom-right (from good styling) */}
            <div className="absolute bottom-4 right-4 z-10">
              <span className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                {currentVideoIndex + 1} / {videos.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showImageModal && (
        <ImageModal
          images={images}
          currentIndex={currentImageIndex}
          onClose={closeImageModal}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
      
      {showVideoModal && (
        <VideoModal
          video={videos[currentVideoIndex]}
          onClose={closeVideoModal}
        />
      )}
    </div>
  );
}