// src/pages/Profile/BuyerOffersTable.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getBuyerOffers, getProperty } from '@/utils/api';
import { useVipBuyer } from '@/utils/VipBuyerContext';
import { formatCurrency, getStatusColors, formatDate } from './profileUtils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ExternalLink, Handshake } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { getLogger } from '@/utils/logger';

const log = getLogger("BuyerOffersTable");

const BuyerOffersTable = () => {
    const { vipBuyerData } = useVipBuyer();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [propertyDetails, setPropertyDetails] = useState({});
    const navigate = useNavigate();

    // Fetch the buyer's offers
    useEffect(() => {
        const fetchOffers = async () => {
            if (!vipBuyerData?.id) return;

            try {
                setLoading(true);
                log.info(
                  `[BuyerOffersTable:fetchOffers] > [Request]: fetching offers for buyerId=${vipBuyerData.id}`
                );

                if (typeof vipBuyerData.id !== 'string') {
                    log.error(
                      `[BuyerOffersTable:fetchOffers] > [Error]: invalid buyer ID format=${vipBuyerData.id}`
                    );

                    if (vipBuyerData.email) {
                        log.info(
                          `[BuyerOffersTable:fetchOffers] > [Response]: using email fallback for ${vipBuyerData.email}`
                        );
                        const data = await getBuyerOffers({ email: vipBuyerData.email });
                        setOffers(data.offers || []);
                    } else {
                        setError("Invalid buyer ID format and no email available");
                    }
                } else {
                    const data = await getBuyerOffers(vipBuyerData.id);
                    setOffers(data.offers || []);

                    const propertyDetailsMap = {};
                    for (const offer of data.offers || []) {
                        try {
                            const property = await getProperty(offer.propertyId);
                            propertyDetailsMap[offer.propertyId] = property;
                        } catch (error) {
                            log.error(
                              `[BuyerOffersTable:fetchOffers] > [Error]: property fetch ${offer.propertyId} ${error.message}`
                            );
                            propertyDetailsMap[offer.propertyId] = { title: "Unknown Property" };
                        }
                    }

                    setPropertyDetails(propertyDetailsMap);
                }
            } catch (error) {
                log.error(`[BuyerOffersTable:fetchOffers] > [Error]: ${error.message}`);
                setError("Failed to load your offers. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, [vipBuyerData]);

    // Handle click to view property details
    const handleViewProperty = (propertyId) => {
        navigate(`/properties/${propertyId}`);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Offers</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Offers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-red-500">{error}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Offers</CardTitle>
            </CardHeader>
            <CardContent>
                {offers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">You haven't made any offers yet.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Offer Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offers.map((offer) => (
                                <TableRow key={offer.id}>
                                    <TableCell>
                                        {propertyDetails[offer.propertyId]?.streetAddress ? (
                                            <span>
                                                {propertyDetails[offer.propertyId].streetAddress}
                                                {propertyDetails[offer.propertyId]?.city && (
                                                    <span>, {propertyDetails[offer.propertyId].city}</span>
                                                )}
                                            </span>
                                        ) : "N/A"}
                                    </TableCell>
                                    <TableCell className="font-medium text-green-600">
                                        {formatCurrency(offer.offeredPrice)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(offer.timestamp)}
                                    </TableCell>
                                    <TableCell>
                                        {/* Improved status display */}
                                        <Badge className={`
                                            ${offer.offerStatus === "PENDING" ? "bg-amber-100 text-amber-800" : ""}
                                            ${offer.offerStatus === "ACCEPTED" ? "bg-green-100 text-green-800" : ""}
                                            ${offer.offerStatus === "REJECTED" ? "bg-red-100 text-red-800" : ""}
                                            ${offer.offerStatus === "COUNTERED" ? "bg-blue-100 text-blue-800" : ""}
                                            ${offer.offerStatus === "EXPIRED" ? "bg-gray-100 text-gray-800" : ""}
                                            ${!offer.offerStatus ? "bg-amber-100 text-amber-800" : ""}
                                        `}>
                                            {offer.offerStatus || "PENDING"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewProperty(offer.propertyId)}
                                            className="text-primary border-primary hover:bg-primary-100"
                                        >
                                            <Handshake className="h-4 w-4 mr-1" />
                                            View Offer
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default BuyerOffersTable;
