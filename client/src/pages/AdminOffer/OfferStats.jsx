// client/src/pages/AdminOffer/OfferStats.jsx
import React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Percent,
  BarChart2,
  AlertCircle,
} from "lucide-react";

const OfferStats = ({ stats }) => {
  // Format currency
  const formatCurrency = (value) => {
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Offers */}
      <Card className="bg-[#f4f7ee]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Offers</span>
            <BarChart2 className="h-5 w-5 text-[#3f4f24]" />
          </div>
          <div className="text-3xl font-bold text-[#3f4f24]">{stats.totalOffers}</div>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>All time</span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Offers */}
      <Card className="bg-[#fcf7e8]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Pending Offers</span>
            <Clock className="h-5 w-5 text-[#D4A017]" />
          </div>
          <div className="text-3xl font-bold text-[#D4A017]">{stats.pending}</div>
          <div className="flex items-center mt-2 text-xs text-amber-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Awaiting response</span>
          </div>
        </CardContent>
      </Card>

      {/* Accepted Offers */}
      <Card className="bg-[#f0f5f4]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Accepted Offers</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
          <div className="flex items-center mt-2 text-xs text-green-600">
            <Percent className="h-4 w-4 mr-1" />
            <span>Acceptance Rate: {formatPercent(stats.acceptanceRate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Average Offer */}
      <Card className="bg-[#fcf7e8]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Average Offer</span>
            <DollarSign className="h-5 w-5 text-[#D4A017]" />
          </div>
          <div className="text-3xl font-bold text-[#D4A017]">
            {formatCurrency(stats.averageOfferPrice)}
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <BarChart2 className="h-4 w-4 mr-1" />
            <span>Across all properties</span>
          </div>
        </CardContent>
      </Card>

      {/* Countered Offers */}
      <Card className="bg-[#f0f5f4]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Countered Offers</span>
            <RefreshCw className="h-5 w-5 text-[#324c48]" />
          </div>
          <div className="text-3xl font-bold text-[#324c48]">{stats.countered}</div>
          <div className="flex items-center mt-2 text-xs text-[#324c48]">
            <Clock className="h-4 w-4 mr-1" />
            <span>Awaiting buyer response</span>
          </div>
        </CardContent>
      </Card>

      {/* Rejected Offers */}
      <Card className="bg-[#f4f7ee]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Rejected Offers</span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-500">{stats.rejected}</div>
          <div className="flex items-center mt-2 text-xs text-red-500">
            <BarChart2 className="h-4 w-4 mr-1" />
            <span>Below minimum price</span>
          </div>
        </CardContent>
      </Card>

      {/* Expired Offers */}
      <Card className="bg-[#f0f5f4]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Expired Offers</span>
            <AlertCircle className="h-5 w-5 text-gray-500" />
          </div>
          <div className="text-3xl font-bold text-gray-500">{stats.expired}</div>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>No longer active</span>
          </div>
        </CardContent>
      </Card>

      {/* Counter Offer Count */}
      <Card className="bg-[#fcf7e8]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Counter Offers Made</span>
            <RefreshCw className="h-5 w-5 text-[#D4A017]" />
          </div>
          <div className="text-3xl font-bold text-[#D4A017]">{stats.counterOffers}</div>
          <div className="flex items-center mt-2 text-xs text-[#D4A017]">
            <BarChart2 className="h-4 w-4 mr-1" />
            <span>Negotiation activity</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferStats;