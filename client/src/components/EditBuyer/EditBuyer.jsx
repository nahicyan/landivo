import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PuffLoader } from "react-spinners";
import { parsePhoneNumber } from "libphonenumber-js";
import { getBuyerById, updateBuyer, getEmailLists, addBuyersToList, removeBuyersFromList } from "@/utils/api";
import { toast } from "react-toastify";

const AREAS = [
  { id: 'DFW', label: 'Dallas Fort Worth' },
  { id: 'Austin', label: 'Austin' },
  { id: 'Houston', label: 'Houston' },
  { id: 'San Antonio', label: 'San Antonio' },
  { id: 'Other Areas', label: 'Other Areas' }
];

export default function EditBuyer() {
  const { buyerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    buyerType: "",
    source: "",
    preferredAreas: []
  });

  const [emailLists, setEmailLists] = useState([]);
  const [currentListMemberships, setCurrentListMemberships] = useState(new Set());
  const [pendingListChanges, setPendingListChanges] = useState(new Map());
  const [originalData, setOriginalData] = useState(null);
  
  const [validationErrors, setValidationErrors] = useState({
    email: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching buyer and email lists...");
        
        const [buyerData, emailListsData] = await Promise.all([
          getBuyerById(buyerId),
          getEmailLists()
        ]);
        
        console.log("Buyer data:", buyerData);
        console.log("Email lists data:", emailListsData);
        
        setFormData({
          firstName: buyerData.firstName || "",
          lastName: buyerData.lastName || "",
          email: buyerData.email || "",
          phone: buyerData.phone || "",
          buyerType: buyerData.buyerType || "",
          source: buyerData.source || "Manual Entry",
          preferredAreas: buyerData.preferredAreas || []
        });
        
        setOriginalData(buyerData);
        setEmailLists(emailListsData || []);
        
        // Set current list memberships
        if (buyerData.emailListMemberships && Array.isArray(buyerData.emailListMemberships)) {
          console.log("Email list memberships:", buyerData.emailListMemberships);
          const membershipIds = new Set(
            buyerData.emailListMemberships.map(membership => membership.emailListId)
          );
          console.log("Current memberships:", membershipIds);
          setCurrentListMemberships(membershipIds);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load buyer information");
      } finally {
        setLoading(false);
      }
    };

    if (buyerId) {
      fetchData();
    }
  }, [buyerId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "email") {
      setValidationErrors(prev => ({ ...prev, email: "" }));
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuyerTypeChange = (value) => {
    setFormData(prev => ({ ...prev, buyerType: value }));
  };

  const handleSourceChange = (value) => {
    setFormData(prev => ({ ...prev, source: value }));
  };

  const handleAreaChange = (areaId) => {
    setFormData(prev => ({
      ...prev,
      preferredAreas: prev.preferredAreas.includes(areaId)
        ? prev.preferredAreas.filter(id => id !== areaId)
        : [...prev.preferredAreas, areaId]
    }));
  };

  const handleEmailListChange = (listId, isChecked) => {
    const currentlyMember = currentListMemberships.has(listId);
    
    if (isChecked && !currentlyMember) {
      setPendingListChanges(prev => {
        const newChanges = new Map(prev);
        newChanges.set(listId, 'add');
        return newChanges;
      });
    } else if (!isChecked && currentlyMember) {
      setPendingListChanges(prev => {
        const newChanges = new Map(prev);
        newChanges.set(listId, 'remove');
        return newChanges;
      });
    } else {
      setPendingListChanges(prev => {
        const newChanges = new Map(prev);
        newChanges.delete(listId);
        return newChanges;
      });
    }
  };

  const getListMembershipState = (listId) => {
    const currentlyMember = currentListMemberships.has(listId);
    const pendingChange = pendingListChanges.get(listId);
    
    if (pendingChange === 'add') return true;
    if (pendingChange === 'remove') return false;
    return currentlyMember;
  };

  const handlePhoneChange = (e) => {
    const rawInput = e.target.value;
    const formatted = formatPhoneNumber(rawInput);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const formatPhoneNumber = (input) => {
    const digitsOnly = input.replace(/\D/g, "");
    
    if (digitsOnly.length === 0) return "";
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, Math.min(10, digitsOnly.length))}`;
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const errors = { email: "" };
    let isValid = true;

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const hasFormChanged = () => {
    if (!originalData) return false;
    
    return (
      formData.firstName !== (originalData.firstName || "") ||
      formData.lastName !== (originalData.lastName || "") ||
      formData.email !== (originalData.email || "") ||
      formData.phone !== (originalData.phone || "") ||
      formData.buyerType !== (originalData.buyerType || "") ||
      formData.source !== (originalData.source || "") ||
      JSON.stringify(formData.preferredAreas.sort()) !== JSON.stringify((originalData.preferredAreas || []).sort()) ||
      pendingListChanges.size > 0
    );
  };

  const applyEmailListChanges = async () => {
    if (pendingListChanges.size === 0) return;

    try {
      const changePromises = [];
      
      for (const [listId, action] of pendingListChanges) {
        if (action === 'add') {
          changePromises.push(addBuyersToList(listId, [buyerId]));
        } else if (action === 'remove') {
          changePromises.push(removeBuyersFromList(listId, [buyerId]));
        }
      }
      
      await Promise.all(changePromises);
      
      const newMemberships = new Set(currentListMemberships);
      for (const [listId, action] of pendingListChanges) {
        if (action === 'add') {
          newMemberships.add(listId);
        } else if (action === 'remove') {
          newMemberships.delete(listId);
        }
      }
      
      setCurrentListMemberships(newMemberships);
      setPendingListChanges(new Map());
      
    } catch (error) {
      console.error("Error updating email list memberships:", error);
      toast.error("Failed to update email list memberships");
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasFormChanged()) {
      navigate(`/admin/buyers/${buyerId}`);
      return;
    }

    if (!validateForm()) {
      return;
    }
  
    try {
      setSubmitting(true);
      
      await updateBuyer(buyerId, formData);
      await applyEmailListChanges();
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/admin/buyers/${buyerId}`);
      }, 1500);
      
    } catch (err) {
      console.error("Error updating buyer:", err);
      setError(err.message || "An error occurred while updating the buyer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#3f4f24" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#324c48]">Edit Buyer</h1>
        <p className="text-gray-600">Update buyer information for {formData.firstName} {formData.lastName}</p>
      </div>
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-300 text-red-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success ? (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">Buyer Updated Successfully!</h2>
              <p className="text-green-700 mb-6">
                The buyer information has been updated in the system.
              </p>
              <Button 
                onClick={() => navigate(`/admin/buyers/${buyerId}`)}
                className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
              >
                Return to Buyer Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-[#324c48]/20">
              <form onSubmit={handleSubmit}>
                <CardHeader className="border-b">
                  <CardTitle>Buyer Information</CardTitle>
                  <CardDescription>
                    Update the buyer's details (only email is required)
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[#324c48]">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[#324c48]">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#324c48]">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                          validationErrors.email ? "border-red-500" : ""
                        }`}
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[#324c48]">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buyerType" className="text-[#324c48]">Buyer Type</Label>
                      <Select value={formData.buyerType} onValueChange={handleBuyerTypeChange}>
                        <SelectTrigger className="border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017]">
                          <SelectValue placeholder="Select buyer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CashBuyer">Cash Buyer</SelectItem>
                          <SelectItem value="Builder">Builder</SelectItem>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="Realtor">Realtor</SelectItem>
                          <SelectItem value="Investor">Investor</SelectItem>
                          <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source" className="text-[#324c48]">Source</Label>
                      <Select value={formData.source} onValueChange={handleSourceChange}>
                        <SelectTrigger className="border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017]">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                          <SelectItem value="Property Offer">Property Offer</SelectItem>
                          <SelectItem value="VIP Buyers List">VIP Buyers List</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#324c48] font-medium">Preferred Areas</Label>
                    <p className="text-sm text-[#324c48]/80 mb-2">Select all areas the buyer is interested in</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AREAS.map((area) => (
                        <div key={area.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`area-${area.id}`}
                            checked={formData.preferredAreas.includes(area.id)}
                            onCheckedChange={() => handleAreaChange(area.id)}
                            className="border-[#324c48]/50 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                          />
                          <Label htmlFor={`area-${area.id}`} className="text-[#324c48] cursor-pointer">
                            {area.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-6 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/admin/buyers/${buyerId}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className={`${hasFormChanged() ? 'bg-[#324c48] hover:bg-[#3f4f24]' : 'bg-gray-400'} text-white`}
                    disabled={submitting || !hasFormChanged()}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-[#324c48]/20">
              <CardHeader className="border-b">
                <CardTitle className="text-[#324c48]">Email Lists</CardTitle>
                <CardDescription>
                  Manage which email lists this buyer belongs to
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {emailLists.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {emailLists.map((list) => {
                        const isChecked = getListMembershipState(list.id);
                        const hasPendingChange = pendingListChanges.has(list.id);
                        
                        return (
                          <div 
                            key={list.id} 
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                              hasPendingChange ? 'border-[#D4A017] bg-[#D4A017]/5' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              id={`list-${list.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleEmailListChange(list.id, checked)}
                              className="border-[#324c48]/50 data-[state=checked]:bg-[#324c48] data-[state=checked]:border-[#324c48] mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={`list-${list.id}`}
                                className="text-sm font-medium text-[#324c48] cursor-pointer block"
                              >
                                {list.name}
                                {hasPendingChange && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-[#D4A017]/10 text-[#D4A017] border-[#D4A017]">
                                    {pendingListChanges.get(list.id) === 'add' ? 'Adding' : 'Removing'}
                                  </Badge>
                                )}
                              </Label>
                              {list.description && (
                                <p className="text-xs text-gray-500 mt-1">{list.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{list.buyerCount} members</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No email lists available</p>
                  </div>
                )}
                
                {pendingListChanges.size > 0 && (
                  <div className="mt-4 p-3 bg-[#f0f5f4] rounded-lg border border-[#324c48]/20">
                    <p className="text-sm text-[#324c48] font-medium">
                      {pendingListChanges.size} pending list change{pendingListChanges.size !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Changes will be applied when you save the buyer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}