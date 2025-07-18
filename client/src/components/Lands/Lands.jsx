import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PuffLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import useProperties from "../../components/hooks/useProperties.js";
import DisplayRow, { createFilter } from "../../components/DisplayRow/DisplayRow";
import axios from "axios";

// Simple variants for fade-up animation
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export const Lands = () => {
  const { data, isError, isLoading } = useProperties();
  const navigate = useNavigate();

  // State for homepage featured properties
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch homepage featured properties
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      if (!data || data.length === 0) return;
      
      setLoadingFeatured(true);
      try {
        // Fetch the homepage PropertyRow to get the order
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/property-rows?rowType=homepage`);
        
        if (response.data && Array.isArray(response.data.displayOrder)) {
          // Get the display order
          const displayOrder = response.data.displayOrder;
          
          // Filter to only include IDs that exist and are featured
          const propertiesMap = new Map(data.map(property => [property.id, property]));
          const featuredIds = displayOrder.filter(id => {
            const property = propertiesMap.get(id);
            return property && property.featured === "Featured";
          });
          
          setFeaturedPropertyIds(featuredIds);
        }
      } catch (error) {
        console.error("Error fetching homepage properties:", error);
        setFeaturedPropertyIds([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedProperties();
  }, [data]);

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h6 className="text-red-600 text-xl font-semibold">
          Error While Fetching Data
        </h6>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#D4A017" />
      </div>
    );
  }

  return (
    <>
      {/* First Section: Find The Best Land In Your Area */}
      <motion.section
        className="py-12 bg-[#FDF8F2]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Section Title */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#3f4f24]">
              Find The Best Land In Your Area
            </h2>
            <p className="text-sm md:text-base text-[#324c48]">
              Browse By Area
            </p>
          </div>

          {/* 5 Categories Grid (DFW, Austin, Houston, San Antonio, Others) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            {/* DFW */}
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-light mb-2 text-[#324c48]">Dallas Fort Worth</h3>
              <div className="relative group w-full aspect-w-16 aspect-h-10 
                              rounded-lg shadow-md overflow-hidden 
                              transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/DFW.png"
                  alt="DFW"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center 
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate("/DFW")} className="bg-white text-[#324c48] font-semibold py-2 px-4 rounded-lg shadow hover:shadow-lg">
                    Lands in DFW
                  </button>
                </div>
              </div>
            </div>

            {/* Austin */}
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-light mb-2 text-[#324c48]">Austin</h3>
              <div className="relative group w-full aspect-w-16 aspect-h-10 
                              rounded-lg shadow-md overflow-hidden 
                              transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/Austin.png"
                  alt="Austin"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center 
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate("/Austin")} className="bg-white text-[#324c48] font-semibold py-2 px-4 rounded-lg shadow hover:shadow-lg">
                    Lands in Austin
                  </button>
                </div>
              </div>
            </div>

            {/* Houston */}
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-light mb-2 text-[#324c48]">Houston</h3>
              <div className="relative group w-full aspect-w-16 aspect-h-10 
                              rounded-lg shadow-md overflow-hidden 
                              transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/Houstin.png"
                  alt="Houston"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center 
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate("/Houston")} className="bg-white text-[#324c48] font-semibold py-2 px-4 rounded-lg shadow hover:shadow-lg">
                    Lands in Houston
                  </button>
                </div>
              </div>
            </div>

            {/* San Antonio */}
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-light mb-2 text-[#324c48]">San Antonio</h3>
              <div className="relative group w-full aspect-w-16 aspect-h-10 
                              rounded-lg shadow-md overflow-hidden 
                              transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/SanAntonio.png"
                  alt="San Antonio"
                  className="w-full h-full object-cover"
                />
                <div onClick={() => navigate("/SanAntonio")} className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center 
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white text-[#324c48] font-semibold py-2 px-4 rounded-lg shadow hover:shadow-lg">
                    Lands in San Antonio
                  </button>
                </div>
              </div>
            </div>

            {/* Others */}
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-light mb-2 text-[#324c48]">Others</h3>
              <div className="relative group w-full aspect-square
                              rounded-lg shadow-md overflow-hidden 
                              transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/others.jpg"
                  alt="Others"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center 
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate("/OtherLands")} className="bg-white text-[#324c48] font-semibold py-2 px-4 rounded-lg shadow hover:shadow-lg">
                    Lands in Other Areas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Second Section: Featured Properties */}
      <motion.section
        className="py-12 bg-[#FDF8F2]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Featured Properties using DisplayRow */}
          <DisplayRow
            properties={data}
            filter={createFilter.featured('homepage', featuredPropertyIds)}
            title="Featured Properties"
            subtitle="Discover our top picks for this week"
            loading={loadingFeatured}
            emptyMessage="No featured properties available at this time."
          />

          {/* Browse All Properties Button */}
          <div className="mt-8 flex justify-end">
            <a href="/properties"
              className="inline-block bg-[#324c48] text-white font-semibold py-2 px-6 rounded-md shadow hover:bg-[#3f4f24] transition-colors"
            >
              Browse All Properties
            </a>
          </div>
        </div>
      </motion.section>
    </>
  );
};

export default Lands;