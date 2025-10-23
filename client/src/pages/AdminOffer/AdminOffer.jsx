// client/src/pages/AdminOffer/AdminOffer.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOffers, getRecentOfferActivity } from "@/utils/api";
import { toast } from "react-toastify";

// Import child components
import OfferStats from "./OfferStats";
import OffersTable from "./OffersTable";
import RecentOfferActivity from "./RecentOfferActivity";

// UI Components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PuffLoader } from "react-spinners";

export default function AdminOffer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refreshes
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({
    totalOffers: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    countered: 0,
    expired: 0,
    averageOfferPrice: 0,
    counterOffers: 0,
    acceptanceRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch all offers and calculate stats
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        
        // Fetch all offers
        const response = await getAllOffers();
        setOffers(response.offers || []);
        
        // Calculate stats
        calculateStats(response.offers || []);
        
        // Get recent activity
        await fetchRecentActivity();
        
      } catch (error) {
        console.error("Error fetching offers:", error);
        toast.error("Failed to load offers");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [refreshKey]);

  // Calculate statistics from offers
  const calculateStats = (offersData) => {
    if (!Array.isArray(offersData) || offersData.length === 0) {
      setStats({
        totalOffers: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        countered: 0,
        expired: 0,
        averageOfferPrice: 0,
        counterOffers: 0,
        acceptanceRate: 0,
      });
      return;
    }

    // Count offers by status
    const pending = offersData.filter(o => o.offerStatus === "PENDING").length;
    const accepted = offersData.filter(o => o.offerStatus === "ACCEPTED").length;
    const rejected = offersData.filter(o => o.offerStatus === "REJECTED").length;
    const countered = offersData.filter(o => o.offerStatus === "COUNTERED").length;
    const expired = offersData.filter(o => o.offerStatus === "EXPIRED").length;
    
    // Calculate average offer price
    const totalPrice = offersData.reduce((sum, offer) => sum + (offer.offeredPrice || 0), 0);
    const avgPrice = offersData.length > 0 ? totalPrice / offersData.length : 0;
    
    // Count counter offers from history
    let counterOfferCount = 0;
    offersData.forEach(offer => {
      if (Array.isArray(offer.offerHistory)) {
        counterOfferCount += offer.offerHistory.filter(h => h.newStatus === "COUNTERED").length;
      }
    });
    
    // Calculate acceptance rate
    const decidedOffers = accepted + rejected;
    const acceptanceRate = decidedOffers > 0 ? (accepted / decidedOffers) * 100 : 0;
    
    setStats({
      totalOffers: offersData.length,
      pending,
      accepted,
      rejected,
      countered,
      expired,
      averageOfferPrice: avgPrice,
      counterOffers: counterOfferCount,
      acceptanceRate
    });
  };

  // Fetch recent offer activity
  const fetchRecentActivity = async () => {
    try {
      const activities = await getRecentOfferActivity(); // Default limit is 10
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      setRecentActivity([]);
    }
  };

  // Handler for when offer status changes
  const handleOfferUpdated = () => {
    toast.success("Offer updated successfully");
    setRefreshKey(prevKey => prevKey + 1); // Trigger a refresh
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PuffLoader size={60} color="#3f4f24" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#324c48] mb-2">Offer Management</h1>
            <p className="text-[#324c48]">
              Track and manage all offers across your property listings
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/admin/properties")}
            className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
          >
            View Properties
          </Button>
        </div>

        {/* Stats Section */}
        <OfferStats stats={stats} />

        {/* Offers Table */}
        <div className="mt-6">
          <OffersTable 
            offers={offers} 
            onOfferUpdated={handleOfferUpdated}
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <RecentOfferActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  );
}