// client/src/components/MultiPropertyMap/MultiPropertyMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MultiPropertyMap({ properties = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // Store map instance
  const markersRef = useRef([]); // Store markers to clear them later
  const [isLoading, setIsLoading] = useState(true);

  // Add CSS once on mount and keep it
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'marker-label-styles';
    style.textContent = `
      .marker-label {
        background: #324c48 !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        border: 2px solid white !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        transform: translateY(-45px) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }
    `;
    
    if (!document.getElementById('marker-label-styles')) {
      document.head.appendChild(style);
    }

    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    // Clear existing markers first
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

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

      // Filter properties with valid coordinates
      const validProperties = properties.filter(
        (p) => p.latitude && p.longitude
      );

      // If no valid properties, clear markers and stop
      if (validProperties.length === 0) {
        // Clear any remaining markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
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

      // Create bounds
      const bounds = new window.google.maps.LatLngBounds();

      // Add markers with price labels
      validProperties.forEach((property) => {
        const position = {
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude),
        };

        // Format price for label
        const price = property.askingPrice 
          ? `$${(parseFloat(property.askingPrice) / 1000).toFixed(0)}k`
          : "N/A";

        // Create marker with default icon
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: property.title || property.streetAddress,
          label: {
            text: price,
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "bold",
            className: "marker-label",
          },
        });

        // Store marker reference for cleanup
        markersRef.current.push(marker);

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #324c48;">
                ${property.title || "Property"}
              </h3>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #4b5b4d;">
                ${property.streetAddress || ""}
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #4b5b4d;">
                ${property.city || ""}, ${property.state || ""}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #D4A017;">
                $${property.askingPrice ? parseFloat(property.askingPrice).toLocaleString() : "N/A"}
              </p>
              <a 
                href="/properties/${property.id}" 
                style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: #324c48; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;"
                target="_blank"
              >
                View Details
              </a>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(position);
      });

      // Fit map to show all markers
      if (validProperties.length > 1) {
        map.fitBounds(bounds);
      } else if (validProperties.length === 1) {
        // Center on single property
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