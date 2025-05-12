// client/src/components/Dashboard/widgets/StatsCard.jsx
import React from "react";
import { useQuery } from "react-query";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Home,
  DollarSign,
  BadgeDollarSign,
  BarChart2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Tag,
  Mail,
  MailCheck,
  FileText
} from "lucide-react";
import { 
  getAllProperties, 
  getAllBuyers, 
  getAllDeals, 
  getPropertyOffers,
  getAllQualifications
} from "@/utils/api";

const StatsCard = () => {
  // Fetch real data from APIs
  const { data: properties, isLoading: propertiesLoading } = useQuery(
    "dashboardProperties",
    getAllProperties,
    { refetchOnWindowFocus: false }
  );
  
  const { data: buyers, isLoading: buyersLoading } = useQuery(
    "dashboardBuyers",
    getAllBuyers,
    { refetchOnWindowFocus: false }
  );
  
  const { data: deals, isLoading: dealsLoading } = useQuery(
    "dashboardDeals",
    () => getAllDeals({ limit: 100 }),
    { refetchOnWindowFocus: false }
  );

  const { data: offers, isLoading: offersLoading } = useQuery(
    "dashboardOffers",
    async () => {
      // Get offers for all properties - in reality, you might need a more specific endpoint
      const allOffers = { offers: [] };
      if (properties && properties.length > 0) {
        // Get offers for the first 5 properties (limit for performance)
        const propertiesToCheck = properties.slice(0, 5);
        for (const property of propertiesToCheck) {
          try {
            const propertyOffers = await getPropertyOffers(property.id);
            if (propertyOffers && propertyOffers.offers) {
              allOffers.offers = [...allOffers.offers, ...propertyOffers.offers];
            }
          } catch (error) {
            console.error(`Error fetching offers for property ${property.id}:`, error);
          }
        }
      }
      return allOffers;
    },
    { 
      enabled: !propertiesLoading && properties?.length > 0,
      refetchOnWindowFocus: false
    }
  );

  const { data: qualifications, isLoading: qualificationsLoading } = useQuery(
    "dashboardQualifications",
    () => getAllQualifications(1, 100),
    { refetchOnWindowFocus: false }
  );

  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "$0";
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Determine if we're still loading any data
  const isLoading = propertiesLoading || buyersLoading || dealsLoading || offersLoading || qualificationsLoading;

  // Calculate statistics from real data
  const calculateStats = () => {
    if (isLoading) return [];
    
    // Properties stats
    const propertyList = properties || [];
    const totalProperties = propertyList.length || 0;
    const availableProperties = propertyList.filter(p => 
      p.status === "Available" || p.status === "Active"
    ).length;
    const pendingProperties = propertyList.filter(p => p.status === "Pending").length;
    const soldProperties = propertyList.filter(p => p.status === "Sold").length;
    
    const propertyPrices = propertyList.map(p => p.askingPrice || 0).filter(p => p > 0);
    const averagePrice = propertyPrices.length > 0 
      ? propertyPrices.reduce((sum, price) => sum + price, 0) / propertyPrices.length 
      : 0;
    
    const featuredProperties = propertyList.filter(p => 
      p.featured === "Yes" || p.featured === "Featured"
    ).length;
    
    // Area stats
    const areaData = {};
    propertyList.forEach(property => {
      const area = property.area;
      if (area) {
        areaData[area] = (areaData[area] || 0) + 1;
      }
    });
    
    // Buyer stats
    const buyerList = buyers || [];
    const totalBuyers = buyerList.length;
    const vipBuyers = buyerList.filter(b => b.source === "VIP Buyers List" || b.auth0Id).length;
    const emailReadyBuyers = totalBuyers; // Assuming all buyers have emails
    
    // Offer stats 
    const offerList = offers?.offers || [];
    const totalOffers = offerList.length;
    const pendingOffers = offerList.filter(o => o.offerStatus === "PENDING").length;
    const acceptedOffers = offerList.filter(o => o.offerStatus === "ACCEPTED").length;
    const rejectedOffers = offerList.filter(o => o.offerStatus === "REJECTED").length;
    const counteredOffers = offerList.filter(o => o.offerStatus === "COUNTERED").length;
    const expiredOffers = offerList.filter(o => o.offerStatus === "EXPIRED").length;
    
    const acceptanceRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;
    
    const offerPrices = offerList
      .filter(o => o.offeredPrice)
      .map(o => o.offeredPrice);
    const averageOfferPrice = offerPrices.length > 0
      ? offerPrices.reduce((sum, price) => sum + price, 0) / offerPrices.length
      : 0;
    
    // Deal stats
    const dealList = deals?.deals || [];
    const totalDeals = dealList.length;
    const activeDeals = dealList.filter(d => d.status === "ACTIVE").length;
    const completedDeals = dealList.filter(d => d.status === "COMPLETED").length;
    
    const totalRevenue = dealList.reduce((sum, d) => sum + (d.totalPaidToDate || 0), 0);
    const avgMonthlyPayment = dealList.length > 0 
      ? dealList.reduce((sum, d) => sum + (d.monthlyPayment || 0), 0) / dealList.length 
      : 0;
    
    // Qualification stats
    const qualificationList = qualifications?.qualifications || [];
    const totalQualifications = qualificationList.length;
    const qualifiedCount = qualificationList.filter(q => q.qualified).length;
    const qualificationRate = totalQualifications > 0 
      ? (qualifiedCount / totalQualifications) * 100 
      : 0;
    
    // Return stats array with real data
    return [
      {
        title: "Total Users",
        value: totalBuyers,
        icon: <Users className="h-5 w-5 text-[#324c48]" />,
        bgColor: "bg-white",
        change: "+15%",
      },
      {
        title: "Active Buyers",
        value: vipBuyers,
        icon: <Users className="h-5 w-5 text-[#3f4f24]" />,
        bgColor: "bg-white",
        change: "+5%",
      },
      {
        title: "Listed Properties",
        value: totalProperties,
        icon: <Home className="h-5 w-5 text-[#D4A017]" />,
        bgColor: "bg-white",
        change: "+12%",
      },
      {
        title: "Monthly Revenue",
        value: formatCurrency(totalRevenue),
        icon: <BadgeDollarSign className="h-5 w-5 text-green-600" />,
        bgColor: "bg-white",
        change: "+24%",
      }
    ];
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center justify-center rounded-full w-10 h-10 bg-muted">
                {stat.icon}
              </div>
              <div className="w-full flex flex-col items-end">
                <div className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </div>
                <div className="flex items-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCard;