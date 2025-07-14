import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserIcon, EnvelopeIcon, PhoneIcon, StarIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { parsePhoneNumber } from 'libphonenumber-js';
import { createVipBuyer } from "@/utils/api";
import { useVipBuyer } from '@/utils/VipBuyerContext';
import VipAlreadyMember from '@/components/GetStarted/VipAlreadyMember';

// Define the available areas
const AREAS = [
  { id: 'DFW', label: 'Dallas Fort Worth' },
  { id: 'Austin', label: 'Austin' },
  { id: 'Houston', label: 'Houston' },
  { id: 'San Antonio', label: 'San Antonio' },
  { id: 'Other Areas', label: 'Other Areas' }
];

// Define buyer types
const BUYER_TYPES = [
  { id: 'CashBuyer', label: 'Cash Buyer' },
  { id: 'Builder', label: 'Builder' },
  { id: 'Developer', label: 'Developer' },
  { id: 'Realtor', label: 'Realtor' },
  { id: 'Investor', label: 'Investor' },
  { id: 'Wholesaler', label: 'Wholesaler' }
];

export default function VipSignupForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showVipPopup, setShowVipPopup] = useState(false);
  
  // Auth0 authentication hooks
  const { isAuthenticated, loginWithRedirect, user, isLoading } = useAuth0();
  
  // VIP buyer status check
  const { 
    isVipBuyer, 
    isLoading: vipLoading, 
    vipBuyerData 
  } = useVipBuyer();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    buyerType: '',
    preferredAreas: []
  });

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    buyerType: '',
    preferredAreas: ''
  });

  // Check if user is already VIP when component mounts
  useEffect(() => {
    if (!vipLoading && isAuthenticated && isVipBuyer) {
      setShowVipPopup(true);
    }
  }, [isAuthenticated, isVipBuyer, vipLoading]);

  // Handle VIP popup close - redirect to home
  const handleVipPopupClose = () => {
    setShowVipPopup(false);
    navigate('/');
  };

  // Set email from Auth0 user or URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    
    let emailToUse = '';
    
    if (isAuthenticated && user?.email) {
      emailToUse = user.email;
    } else if (emailParam) {
      emailToUse = emailParam;
    }
    
    if (emailToUse) {
      setFormData(prev => ({ ...prev, email: emailToUse }));
    }
  }, [location, isAuthenticated, user]);

  // Redirect to Auth0 if not authenticated (but avoid redirect loops)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthCode = urlParams.has('code');
    const hasAuthState = urlParams.has('state');
    
    if (isLoading || hasAuthCode || hasAuthState || isAuthenticated) {
      return;
    }
    
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          redirect_uri: `${window.location.origin}/vip-signup`
        },
        appState: { returnTo: '/vip-signup' }
      });
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle buyer type selection
  const handleBuyerTypeChange = (value) => {
    setValidationErrors(prev => ({ ...prev, buyerType: '' }));
    setFormData(prev => ({ ...prev, buyerType: value }));
  };

  // Handle preferred areas selection (checkboxes)
  const handleAreaChange = (areaId) => {
    setValidationErrors(prev => ({ ...prev, preferredAreas: '' }));

    setFormData(prev => {
      if (prev.preferredAreas.includes(areaId)) {
        return {
          ...prev,
          preferredAreas: prev.preferredAreas.filter(id => id !== areaId)
        };
      } else {
        return {
          ...prev,
          preferredAreas: [...prev.preferredAreas, areaId]
        };
      }
    });
  };

  // Email validation helper
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else {
      try {
        const phoneNumber = parsePhoneNumber(formData.phone, 'US');
        if (!phoneNumber.isValid()) {
          errors.phone = 'Please enter a valid phone number';
          isValid = false;
        }
      } catch (err) {
        errors.phone = 'Please enter a valid phone number';
        isValid = false;
      }
    }

    if (!formData.buyerType) {
      errors.buyerType = 'Please select a buyer type';
      isValid = false;
    }

    if (formData.preferredAreas.length === 0) {
      errors.preferredAreas = 'Please select at least one preferred area';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isAuthenticated || !user) {
      setError('You must be logged in to complete VIP signup');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createVipBuyer({
        ...formData,
        auth0Id: user.sub
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/vip-signup-success');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating VIP buyer:', err);
      setError(err.response?.data?.message || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth status or processing callback
  if (isLoading || vipLoading || (!isAuthenticated && !new URLSearchParams(window.location.search).has('code'))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8F2] via-[#FDF8F2] to-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A017] mx-auto mb-4"></div>
          <p className="text-[#324c48]">
            {new URLSearchParams(window.location.search).has('code') 
              ? 'Completing authentication...' 
              : 'Checking your status...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8F2] via-[#FDF8F2] to-[#F5F0E8] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-[#3f4f24] mb-2">
                    One Last Step To Join<br/> Our Exclusive Buyers List
                  </h1>
                  <p className="text-[#324c48] text-sm">
                    Get notified before everyone else, receive instant discounts on properties, and stay up to date with notifications only in the areas you care about.
                  </p>
                </div>

                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                    <AlertDescription>
                      Success! You've been added to our VIP list. Redirecting...
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email field */}
                  <div>
                    <Label htmlFor="email" className="text-[#324c48] font-medium text-sm mb-1 block">
                      Email Address *
                      {isAuthenticated && (
                        <span className="text-xs text-gray-500 ml-1 font-normal">(from your account)</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="nathan@landersinvestment.com"
                      className={`h-10 text-gray-700 border-gray-300 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                        isAuthenticated ? 'bg-gray-50 text-gray-600' : ''
                      } ${validationErrors.email ? 'border-red-500' : ''}`}
                      disabled={isAuthenticated || loading}
                      readOnly={isAuthenticated}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName" className="text-[#324c48] font-medium text-sm mb-1 block">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                        className={`h-10 border-gray-300 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                          validationErrors.firstName ? 'border-red-500' : ''
                        }`}
                        disabled={loading}
                      />
                      {validationErrors.firstName && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-[#324c48] font-medium text-sm mb-1 block">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className={`h-10 border-gray-300 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                          validationErrors.lastName ? 'border-red-500' : ''
                        }`}
                        disabled={loading}
                      />
                      {validationErrors.lastName && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone" className="text-[#324c48] font-medium text-sm mb-1 block">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className={`h-10 border-gray-300 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                        validationErrors.phone ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Buyer Type */}
                  <div>
                    <Label className="text-[#324c48] font-medium text-sm mb-1 block">
                      Buyer Type *
                    </Label>
                    <Select
                      value={formData.buyerType}
                      onValueChange={handleBuyerTypeChange}
                      disabled={loading}
                    >
                      <SelectTrigger className={`h-10 border-gray-300 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                        validationErrors.buyerType ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Select buyer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUYER_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.buyerType && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.buyerType}</p>
                    )}
                  </div>

                  {/* Preferred Areas */}
                  <div>
                    <Label className="text-[#324c48] font-medium text-sm mb-2 block">
                      Preferred Areas *
                    </Label>
                    <div className="space-y-2">
                      {AREAS.map((area) => (
                        <div key={area.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={area.id}
                            checked={formData.preferredAreas.includes(area.id)}
                            onCheckedChange={() => handleAreaChange(area.id)}
                            disabled={loading}
                            className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                          />
                          <Label
                            htmlFor={area.id}
                            className="text-sm cursor-pointer text-[#324c48]"
                          >
                            {area.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {validationErrors.preferredAreas && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.preferredAreas}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#3f4f24] hover:bg-[#324c48] text-white py-3 h-12 text-base font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl mt-6"
                  >
                    {loading ? 'Processing...' : 'Join VIP List'}
                  </Button>

                  {/* Privacy Notice */}
                  <p className="text-xs text-[#324c48]/70 text-center mt-3">
                    Your email is 100% confidential and we won't spam you.
                  </p>
                </form>
              </div>

              {/* Right Side - Benefits */}
              <div className="bg-gradient-to-br from-[#3f4f24] via-[#324c48] to-[#2a3f3c] p-8 flex flex-col justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-8 right-8 w-32 h-32 bg-[#D4A017] rounded-full blur-3xl"></div>
                  <div className="absolute bottom-8 left-8 w-24 h-24 bg-[#D4A017] rounded-full blur-2xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mb-2 font-medium">
                      Listed Price
                    </div>
                    <h2 className="text-4xl font-bold text-[#D4A017] mb-4">
                      Big Discount
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-[#D4A017] mr-3 flex-shrink-0" />
                      <span className="text-white font-medium">
                        Early access to new listings
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-[#D4A017] mr-3 flex-shrink-0" />
                      <span className="text-white font-medium">
                        Member-only special pricing
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-[#D4A017] mr-3 flex-shrink-0" />
                      <span className="text-white font-medium">
                        Exclusive property alerts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Already Member Popup */}
      <VipAlreadyMember 
        isOpen={showVipPopup} 
        onClose={handleVipPopupClose} 
      />
    </>
  );
}