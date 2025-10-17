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
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/property-rows?rowType=homepage`);
        
        if (response.data && Array.isArray(response.data.displayOrder)) {
          const displayOrder = response.data.displayOrder;
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
      <div className="flex items-center justify-center h-[60vh] px-4">
        <h6 className="text-red-600 text-lg sm:text-xl font-semibold text-center">
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

  // Area categories data
  const areaCategories = [
    {
      name: "Dallas Fort Worth",
      shortName: "DFW",
      image: "https://cdn.landivo.com/wp-content/uploads/2025/04/DFW.png",
      route: "/DFW",
      buttonText: "Lands in DFW"
    },
    {
      name: "Austin",
      shortName: "Austin",
      image: "https://cdn.landivo.com/wp-content/uploads/2025/04/Austin.png",
      route: "/Austin",
      buttonText: "Lands in Austin"
    },
    {
      name: "Houston",
      shortName: "Houston",
      image: "https://cdn.landivo.com/wp-content/uploads/2025/04/Houstin.png",
      route: "/Houston",
      buttonText: "Lands in Houston"
    },
    {
      name: "San Antonio",
      shortName: "San Antonio",
      image: "https://cdn.landivo.com/wp-content/uploads/2025/04/SanAntonio.png",
      route: "/SanAntonio",
      buttonText: "Lands in San Antonio"
    },
    {
      name: "Others",
      shortName: "Others",
      image: "https://cdn.landivo.com/wp-content/uploads/2025/04/others.jpg",
      route: "/OtherLands",
      buttonText: "Lands in Other Areas"
    }
  ];

  return (
    <>
      {/* First Section: Find The Best Land In Your Area */}
      <motion.section
        className="py-8 sm:py-10 lg:py-12 bg-[#FDF8F2]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-[#3f4f24]">
              Find The Best Land In Your Area
            </h2>
            <p className="text-sm sm:text-base text-[#324c48]">
              Browse By Area
            </p>
          </div>

          {/* 5 Categories Grid - 2 columns on mobile, centered last item */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {areaCategories.map((category, index) => {
              // Check if this is the last item (5th item) on mobile/tablet
              const isLastItem = index === areaCategories.length - 1;
              const isOddTotal = areaCategories.length % 2 !== 0;
              
              return (
                <div 
                  key={category.shortName}
                  className={`
                    flex flex-col items-center
                    ${isLastItem && isOddTotal ? 'col-span-2 md:col-span-1' : ''}
                  `}
                >
                  <h3 className="text-base sm:text-lg lg:text-xl font-light mb-2 text-[#324c48] text-center">
                    {category.name}
                  </h3>
                  <div 
                    className={`
                      relative group w-full aspect-square
                      rounded-lg shadow-md overflow-hidden 
                      transition-transform transform hover:-translate-y-1 hover:shadow-xl
                      ${isLastItem && isOddTotal ? 'max-w-[calc(50%-0.5rem)] md:max-w-full mx-auto' : ''}
                    `}
                  >
                    <img
                      src={category.image}
                      alt={category.shortName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center 
                                    opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(category.route)} 
                        className="bg-white text-[#324c48] font-semibold py-2 px-3 sm:px-4 text-xs sm:text-sm lg:text-base rounded-lg shadow hover:shadow-lg"
                      >
                        {category.buttonText}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Second Section: Featured Properties */}
      <motion.section
        className="py-8 sm:py-10 lg:py-12 bg-[#FDF8F2]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="mt-6 sm:mt-8 flex justify-center sm:justify-end px-4 sm:px-0">
            <a 
              href="/properties"
              className="inline-block w-full sm:w-auto text-center bg-[#324c48] text-white font-semibold py-2.5 sm:py-2 px-6 text-sm sm:text-base rounded-md shadow hover:bg-[#3f4f24] transition-colors"
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