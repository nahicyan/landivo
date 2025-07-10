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
import { UserIcon, EnvelopeIcon, PhoneIcon, StarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { parsePhoneNumber } from 'libphonenumber-js';
import { createVipBuyer } from "@/utils/api";

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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Auth0 authentication hooks
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '', // Add email to form data
    firstName: '',
    lastName: '',
    phone: '',
    buyerType: '',
    preferredAreas: []
  });

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState({
    email: '', // Add email validation
    firstName: '',
    lastName: '',
    phone: '',
    buyerType: '',
    preferredAreas: ''
  });

  // Get email from URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [location]);

  // Update handleInputChange to include email
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update email state if email field changes
    if (name === 'email') {
      setEmail(value);
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle buyer type selection
  const handleBuyerTypeChange = (value) => {
    setValidationErrors(prev => ({
      ...prev,
      buyerType: ''
    }));
    
    setFormData(prev => ({
      ...prev,
      buyerType: value
    }));
  };

  // Handle preferred areas selection (checkboxes)
  const handleAreaChange = (areaId) => {
    setValidationErrors(prev => ({
      ...prev,
      preferredAreas: ''
    }));

    setFormData(prev => {
      // Check if the area is already selected
      if (prev.preferredAreas.includes(areaId)) {
        // If it is, remove it
        return {
          ...prev,
          preferredAreas: prev.preferredAreas.filter(id => id !== areaId)
        };
      } else {
        // If it's not, add it
        return {
          ...prev,
          preferredAreas: [...prev.preferredAreas, areaId]
        };
      }
    });
  };

  // Add email validation helper
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Update validateForm to include email validation
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    // Phone validation
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

    // Buyer type validation
    if (!formData.buyerType) {
      errors.buyerType = 'Please select a buyer type';
      isValid = false;
    }

    // Preferred areas validation
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

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save form data to localStorage before redirecting to Auth0
      localStorage.setItem('vipSignupData', JSON.stringify({
        ...formData,
        email: email
      }));
      
      loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          redirect_uri: `${window.location.origin}/vip-signup${email ? `?email=${encodeURIComponent(email)}` : ''}`
        },
        appState: { returnTo: `/vip-signup${email ? `?email=${encodeURIComponent(email)}` : ''}` }
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Format phone number for storage
      let formattedPhone = formData.phone;
      try {
        const phoneNumber = parsePhoneNumber(formData.phone, 'US');
        if (phoneNumber.isValid()) {
          formattedPhone = phoneNumber.formatNational();
        }
      } catch (err) {
        console.warn('Phone number formatting failed, using original value');
      }

      const buyerData = {
        email: email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formattedPhone,
        buyerType: formData.buyerType,
        preferredAreas: formData.preferredAreas,
        status: 'active'
      };

      await createVipBuyer(buyerData);
      
      // Clear saved form data
      localStorage.removeItem('vipSignupData');
      
      setSuccess(true);
      
      // Redirect to success page or properties page after a delay
      setTimeout(() => {
        navigate('/subscription');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to create VIP buyer:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load saved form data after authentication
  useEffect(() => {
    if (isAuthenticated && email && !success) {
      const savedData = localStorage.getItem('vipSignupData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(prev => ({
            ...prev,
            ...parsedData
          }));
          localStorage.removeItem('vipSignupData');
        } catch (e) {
          console.error("Error parsing saved form data:", e);
        }
      }
    }
  }, [isAuthenticated, email, success]);

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <StarIcon className="h-12 w-12 text-[#D4A017] mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-[#3f4f24] mb-2">One Last Step to Join Our VIP Buyers List</h1>
          <p className="text-lg text-[#324c48]">
            Please complete your profile to get access to exclusive property deals
          </p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-300 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="text-center py-8">
              <StarIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Welcome to Our VIP Buyers List!</h2>
              <p className="text-green-700 mb-4">
                Your profile has been successfully created. You will now receive exclusive access to our best property deals.
              </p>
              <p className="text-green-600">
                Redirecting you to your subscription dashboard...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#324c48]/20">
            <CardHeader className="border-b pb-6">
              <CardTitle className="text-xl text-[#3f4f24] flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Your Information
              </CardTitle>
              <CardDescription>
                Please fill in your details to join our VIP Buyers List
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#324c48] flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-1" />
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                      validationErrors.email ? 'border-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#324c48]">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className={`border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                        validationErrors.firstName ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.firstName && (
                      <p className="text-sm text-red-500">{validationErrors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#324c48]">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className={`border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                        validationErrors.lastName ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.lastName && (
                      <p className="text-sm text-red-500">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#324c48] flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className={`border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                      validationErrors.phone ? 'border-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Buyer Type */}
                <div className="space-y-2">
                  <Label className="text-[#324c48] flex items-center">
                    <StarIcon className="w-4 h-4 mr-1" />
                    Buyer Type <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.buyerType} 
                    onValueChange={handleBuyerTypeChange}
                    disabled={loading}
                  >
                    <SelectTrigger className={`border-[#324c48]/30 focus:border-[#D4A017] focus:ring-[#D4A017] ${
                      validationErrors.buyerType ? 'border-red-500' : ''
                    }`}>
                      <SelectValue placeholder="Select your buyer type" />
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
                    <p className="text-sm text-red-500">{validationErrors.buyerType}</p>
                  )}
                </div>

                {/* Preferred Areas */}
                <div className="space-y-2">
                  <Label className="text-[#324c48] flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    Preferred Areas <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-3">
                    {AREAS.map((area) => (
                      <div key={area.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={area.id}
                          checked={formData.preferredAreas.includes(area.id)}
                          onCheckedChange={() => handleAreaChange(area.id)}
                          disabled={loading}
                          className="border-[#324c48]/30 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                        />
                        <Label 
                          htmlFor={area.id} 
                          className="text-[#324c48] cursor-pointer"
                        >
                          {area.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {validationErrors.preferredAreas && (
                    <p className="text-sm text-red-500">{validationErrors.preferredAreas}</p>
                  )}
                </div>

                <CardFooter className="px-0 pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-[#D4A017] hover:bg-[#B8890F] text-white font-semibold py-3"
                    disabled={loading}
                  >
                    {loading ? 'Creating Profile...' : 'Join VIP Buyers List'}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}