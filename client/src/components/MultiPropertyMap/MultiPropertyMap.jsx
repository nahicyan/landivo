// client/src/components/MultiPropertyMap/MultiPropertyMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const serverURL = import.meta.env.VITE_SERVER_URL;

export default function MultiPropertyMap({ properties = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to create info window content
  const createInfoWindowContent = (property) => {
    // Parse images safely
    let images = [];
    try {
      if (property.imageUrls) {
        images = Array.isArray(property.imageUrls)
          ? property.imageUrls
          : JSON.parse(property.imageUrls);
      }
    } catch (error) {
      console.error("Error parsing imageUrls:", error);
    }

    const imageUrl = images.length > 0 
      ? `${serverURL}/${images[0]}` 
      : `${serverURL}/default-image.jpg`;

    // Create DOM element instead of HTML string
    const content = document.createElement('div');
    content.style.cssText = 'max-width: 280px; font-family: system-ui, -apple-system, sans-serif;';
    
    // Create and append image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = property.title || 'Property';
    img.style.cssText = 'width: 100%; height: 160px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -8px -8px 12px -8px;';
    img.onerror = function() { this.style.display = 'none'; };
    content.appendChild(img);
    
    // Create content wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding: 0 8px 8px 8px;';
    
    // Title
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #324c48;';
    title.textContent = property.title || "Property";
    wrapper.appendChild(title);
    
    // Address
    const address = document.createElement('p');
    address.style.cssText = 'margin: 0 0 4px 0; font-size: 13px; color: #4b5b4d;';
    address.textContent = property.streetAddress || "";
    wrapper.appendChild(address);
    
    // City, State, Zip
    const location = document.createElement('p');
    location.style.cssText = 'margin: 0 0 8px 0; font-size: 13px; color: #4b5b4d;';
    location.textContent = `${property.city || ""}, ${property.state || ""} ${property.zip || ""}`;
    wrapper.appendChild(location);
    
    // Details container
    const details = document.createElement('div');
    details.style.cssText = 'border-top: 1px solid #e5e7eb; padding-top: 8px; margin-bottom: 8px;';
    
    // Price
    const price = document.createElement('p');
    price.style.cssText = 'margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #D4A017;';
    price.textContent = `$${property.askingPrice ? parseFloat(property.askingPrice).toLocaleString() : "N/A"}`;
    details.appendChild(price);
    
    // Acres and sqft
    if (property.acre) {
      const size = document.createElement('p');
      size.style.cssText = 'margin: 0 0 4px 0; font-size: 12px; color: #4b5b4d;';
      size.textContent = `${property.acre} acres • ${property.sqft ? parseInt(property.sqft).toLocaleString() + ' sqft' : ''}`;
      details.appendChild(size);
    }
    
    // Type
    if (property.type) {
      const type = document.createElement('p');
      type.style.cssText = 'margin: 0; font-size: 12px; color: #4b5b4d;';
      type.textContent = `Type: ${property.type}`;
      details.appendChild(type);
    }
    
    wrapper.appendChild(details);
    
    // View details link
    const link = document.createElement('a');
    link.href = `/properties/${property.id}`;
    link.target = '_blank';
    link.style.cssText = 'display: inline-block; margin-top: 8px; padding: 6px 16px; background: #324c48; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;';
    link.textContent = 'View Details';
    wrapper.appendChild(link);
    
    content.appendChild(wrapper);
    
    return content;
  };

  useEffect(() => {
    // Clear existing markers and overlays
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    if (!properties || properties.length === 0) {
      setIsLoading(false);
      return;
    }

    // Load Google Maps script if not already loaded
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      // Custom overlay for price labels
      class PriceLabel extends google.maps.OverlayView {
        constructor(position, price, map, clickCallback) {
          super();
          this.position = position;
          this.price = price;
          this.clickCallback = clickCallback;
          this.div = null;
          this.setMap(map);
        }

        onAdd() {
          this.div = document.createElement('div');
          this.div.style.position = 'absolute';
          this.div.style.cursor = 'pointer';
          
          const label = document.createElement('div');
          label.style.cssText = `
            background: #324c48;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            font-size: 12px;
            font-weight: bold;
            font-family: system-ui, -apple-system, sans-serif;
            transition: all 0.2s;
          `;
          label.textContent = this.price;
          
          label.onmouseover = function() { this.style.background = '#253936'; };
          label.onmouseout = function() { this.style.background = '#324c48'; };
          
          // Add click listener directly
          label.onclick = this.clickCallback;
          
          this.div.appendChild(label);
          
          const panes = this.getPanes();
          panes.overlayMouseTarget.appendChild(this.div);
        }

        draw() {
          const overlayProjection = this.getProjection();
          const position = overlayProjection.fromLatLngToDivPixel(this.position);
          
          if (this.div) {
            this.div.style.left = position.x - 25 + 'px';
            this.div.style.top = position.y - 70 + 'px'; // Increased from -50 to -65
          }
        }

        onRemove() {
          if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }

      // Filter properties with valid coordinates
      const validProperties = properties.filter(
        (p) => p.latitude && p.longitude
      );

      if (validProperties.length === 0) {
        setIsLoading(false);
        return;
      }

      // Calculate center point
      const centerLat =
        validProperties.reduce((sum, p) => sum + parseFloat(p.latitude), 0) /
        validProperties.length;
      const centerLng =
        validProperties.reduce((sum, p) => sum + parseFloat(p.longitude), 0) /
        validProperties.length;

      // Create or reuse map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      const map = mapInstanceRef.current;
      const bounds = new window.google.maps.LatLngBounds();

      // Add markers with custom price overlays
      validProperties.forEach((property) => {
        const position = new google.maps.LatLng(
          parseFloat(property.latitude),
          parseFloat(property.longitude)
        );

        // Format price for label
        const price = property.askingPrice 
          ? `$${(parseFloat(property.askingPrice) / 1000).toFixed(0)}k`
          : "N/A";

        // Create marker without label
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: property.title || property.streetAddress,
        });

        // Create info window with DOM element
        const infoWindow = new window.google.maps.InfoWindow({
          content: createInfoWindowContent(property)
        });

        // Create custom price overlay with click handler
        const priceLabel = new PriceLabel(position, price, map, () => {
          infoWindow.open(map, marker);
        });

        // Store references
        markersRef.current.push(marker);
        overlaysRef.current.push(priceLabel);

        // Open info window on marker click
        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(position);
      });

      // Fit map to show all markers
      if (validProperties.length > 1) {
        map.fitBounds(bounds);
      } else if (validProperties.length === 1) {
        map.setCenter({
          lat: parseFloat(validProperties[0].latitude),
          lng: parseFloat(validProperties[0].longitude),
        });
        map.setZoom(15);
      }

      setIsLoading(false);
    };

    loadGoogleMapsScript();
  }, [properties]);

  return (
    <Card className="border-none shadow-lg bg-white h-full">
      <CardContent className="relative w-full h-full p-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#324c48]" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      </CardContent>
    </Card>
  );
}