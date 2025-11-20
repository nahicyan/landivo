// client/src/components/MultiPropertyMap/MultiPropertyMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatPrice } from "../../utils/format";
import { useShowAddress } from "../../utils/addressUtils";

const serverURL = import.meta.env.VITE_SERVER_URL;

// Helper function to format county name
const formatCountyName = (county) => {
  if (!county) return "County unavailable";
  if (county.toLowerCase().includes("county")) {
    return county;
  }
  return `${county} County`;
};

// Updated function to get display address with county fallback
const getDisplayAddress = (
  streetAddress,
  toggleObscure,
  showAddress,
  county
) => {
  if (!toggleObscure || showAddress) {
    return streetAddress || "Address unavailable";
  }
  return formatCountyName(county);
};

export default function MultiPropertyMap({ properties = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);
  const showAddressMap = {};
  
  // Create address visibility map for all properties
  properties.forEach(property => {
    showAddressMap[property.id] = useShowAddress(property.toggleObscure);
  });

  // Helper to create info window content
  const createInfoWindowContent = (property) => {
    const isSold = property.status === "Sold";
    const showAddress = showAddressMap[property.id];
    
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

    const formattedPrice = property.askingPrice ? formatPrice(property.askingPrice) : "0";
    
    // Calculate minimum monthly payment
    const getMonthlyPayment = () => {
      if (!property.financing || property.financing !== "Available") return null;

      const payments = [
        property.monthlyPaymentOne,
        property.monthlyPaymentTwo,
        property.monthlyPaymentThree,
      ].filter((payment) => payment && !isNaN(payment));

      if (payments.length === 0) return null;
      const minPayment = Math.min(...payments);
      return Math.floor(minPayment).toLocaleString();
    };

    const monthlyPayment = getMonthlyPayment();
    const displayAddress = getDisplayAddress(
      property.streetAddress,
      property.toggleObscure,
      showAddress,
      property.county
    );

    // Create DOM element
    const content = document.createElement('div');
    content.style.cssText = 'width: 280px; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; padding: 0px 0px 0px 4px; border-radius: 12px; background: white;';

    // Image container with tags
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = 'position: relative; width: 100%; height: 180px; overflow: hidden; border-radius: 12px 12px 12px 12px;';

    
    // Image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = property.title || 'Property';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    img.onerror = function() { 
      this.src = `${serverURL}/default-image.jpg`;
    };
    imageContainer.appendChild(img);
    
    
    
    if (isSold) {
      const soldBadge = document.createElement('div');
      soldBadge.style.cssText = 'position: absolute; top: 8px; right: 8px; background: linear-gradient(to right, #ef4444, #dc2626); color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
      soldBadge.textContent = 'SOLD';
      imageContainer.appendChild(soldBadge);
    }
    
    content.appendChild(imageContainer);
    
    // Content wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding: 12px; space-y: 4px;';
    
    // Acres and Price Row
    const priceRow = document.createElement('div');
    priceRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';
    
    const acres = document.createElement('span');
    acres.style.cssText = 'color: #6b7280; font-size: 14px;';
    acres.textContent = `${property.acre || "0"} Acres`;
    priceRow.appendChild(acres);
    
    const price = document.createElement('span');
    price.style.cssText = `color: #517b75; font-weight: 600; font-size: 16px; ${isSold ? 'filter: blur(4px);' : ''}`;
    price.textContent = `$${formattedPrice}`;
    priceRow.appendChild(price);
    
    wrapper.appendChild(priceRow);
    
    // Address and Monthly Payment Row
    const addressRow = document.createElement('div');
    addressRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px;';
    
    const address = document.createElement('h3');
    address.style.cssText = 'color: #1f2937; font-weight: 600; font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    address.textContent = displayAddress;
    addressRow.appendChild(address);
    
    if (monthlyPayment) {
      const payment = document.createElement('span');
      payment.style.cssText = `color: #D4A017; font-weight: 500; font-size: 14px; white-space: nowrap; ${isSold ? 'filter: blur(4px);' : ''}`;
      payment.textContent = `$${monthlyPayment}/mo`;
      addressRow.appendChild(payment);
    }
    
    wrapper.appendChild(addressRow);
    
    // City, State, Zip
    const location = document.createElement('p');
    location.style.cssText = 'color: #6b7280; font-weight: 500; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 12px;';
    const parts = [];
    if (property.city) parts.push(property.city);
    if (property.state) parts.push(property.state);
    let locationText = parts.join(", ");
    if (property.zip) {
      locationText = locationText ? `${locationText} ${property.zip}` : property.zip;
    }
    location.textContent = locationText || "Location unavailable";
    wrapper.appendChild(location);
    
    // View details button
    const link = document.createElement('a');
    link.href = `/properties/${property.id}`;
    link.target = '_blank';
    link.style.cssText = 'display: inline-block; width: 100%; text-align: center; padding: 8px 16px; background: #324c48; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;';
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
            this.div.style.top = position.y - 70 + 'px';
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