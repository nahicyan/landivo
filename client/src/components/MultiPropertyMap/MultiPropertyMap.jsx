// client/src/components/MultiPropertyMap/MultiPropertyMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MultiPropertyMap({ properties = [] }) {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!properties || properties.length === 0) return;

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

      if (validProperties.length === 0) {
        setIsLoading(false);
        return;
      }

      // Calculate center point (average of all coordinates)
      const centerLat =
        validProperties.reduce((sum, p) => sum + parseFloat(p.latitude), 0) /
        validProperties.length;
      const centerLng =
        validProperties.reduce((sum, p) => sum + parseFloat(p.longitude), 0) /
        validProperties.length;

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 10,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds();

      // Add markers for each property
      validProperties.forEach((property) => {
        const position = {
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude),
        };

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: property.title || property.streetAddress,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });

        // Create info window with property details
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
      }

      setIsLoading(false);
    };

    loadGoogleMapsScript();
  }, [properties]);

  // Fallback to iframe map if Google Maps API is not available
  const renderFallbackMap = () => {
    if (properties.length === 0) return null;

    // Get first property with coordinates for center point
    const centerProperty = properties.find((p) => p.latitude && p.longitude);

    if (!centerProperty) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <p className="text-gray-500">No location data available</p>
        </div>
      );
    }

    const googleMapsUrl = `https://www.google.com/maps?q=${centerProperty.latitude},${centerProperty.longitude}&output=embed&zoom=10`;

    return (
      <iframe
        loading="lazy"
        src={googleMapsUrl}
        className="w-full h-full border-none rounded-lg"
        title="Property Map"
      />
    );
  };

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