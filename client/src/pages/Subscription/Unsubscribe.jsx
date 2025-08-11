// client/src/pages/Subscription/Unsubscribe.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  HeartIcon, 
  EnvelopeIcon,
  MapPinIcon,
  BellIcon,
  TagIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

// Define the available areas matching your project
const AREAS = [
  { id: 'DFW', label: 'Dallas Fort Worth', value: 'DFW' },
  { id: 'Austin', label: 'Austin', value: 'Austin' },
  { id: 'Houston', label: 'Houston', value: 'Houston' },
  { id: 'San Antonio', label: 'San Antonio', value: 'San Antonio' },
  { id: 'Other Areas', label: 'Other Areas', value: 'Other Areas' }
];

// Define subscription types
const EMAIL_TYPES = [
  { 
    id: 'weeklyUpdates', 
    label: 'Weekly Property Updates',
    description: 'Get the latest properties that match your interests',
    icon: BellIcon
  },
  { 
    id: 'holidayDeals', 
    label: 'Holiday Deals',
    description: 'Special holiday promotions and seasonal offers',
    icon: GiftIcon
  },
  { 
    id: 'specialDiscounts', 
    label: 'Special Discounts',
    description: 'Exclusive discounts and VIP pricing opportunities',
    icon: TagIcon
  }
];

export default function Unsubscribe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buyer, setBuyer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Subscription preferences state
  const [preferences, setPreferences] = useState({
    preferredAreas: [],
    weeklyUpdates: 'available',
    holidayDeals: 'available', 
    specialDiscounts: 'available'
  });

  // Fetch buyer data and current preferences
  useEffect(() => {
    fetchBuyerData();
  }, [id]);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/buyer/unsubscribe/${id}/data`);
      
      if (!response.ok) {
        throw new Error('Buyer not found or invalid unsubscribe link');
      }
      
      const buyerData = await response.json();
      setBuyer(buyerData);
      
      // Set current preferences
      setPreferences({
        preferredAreas: buyerData.preferredAreas || [],
        weeklyUpdates: buyerData.weeklyUpdates || 'available',
        holidayDeals: buyerData.holidayDeals || 'available',
        specialDiscounts: buyerData.specialDiscounts || 'available'
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (areaId) => {
    setPreferences(prev => ({
      ...prev,
      preferredAreas: prev.preferredAreas.includes(areaId)
        ? prev.preferredAreas.filter(area => area !== areaId)
        : [...prev.preferredAreas, areaId]
    }));
  };

  const handleEmailTypeChange = (emailType) => {
    setPreferences(prev => ({
      ...prev,
      [emailType]: prev[emailType] === 'available' ? 'unsubscribe' : 'available'
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/buyer/unsubscribe/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setSuccess(true);
      
      // Auto redirect after success
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError('Failed to update your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteUnsubscribe = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/buyer/unsubscribe/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError('Failed to unsubscribe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f4f24] mx-auto mb-4"></div>
          <p className="text-[#324c48]">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  if (error && !buyer) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              This unsubscribe link is not valid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} className="bg-[#3f4f24] hover:bg-[#324c48]">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#3f4f24] mb-2">
            Preferences Updated!
          </h2>
          <p className="text-[#324c48] mb-4">
            Your email preferences have been successfully updated.
          </p>
          <p className="text-sm text-[#324c48]/70">
            Redirecting you to the homepage...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with GIF */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img 
            src="https://cdn.landivo.com/wp-content/uploads/2025/08/unsub.gif" 
            alt="Unsubscribe"
            className="mx-auto mb-6 rounded-lg shadow-lg max-w-xs"
          />
          <h1 className="text-3xl font-bold text-[#3f4f24] mb-2">
            We're Sorry to See You Leave!
          </h1>
          <p className="text-[#324c48] text-lg">
            Hi {buyer?.firstName || 'there'}! Instead of leaving completely, how about customizing what you receive?
          </p>
        </motion.div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-[#3f4f24] flex items-center justify-center gap-2">
                <EnvelopeIcon className="h-6 w-6" />
                Customize Your Email Preferences
              </CardTitle>
              <CardDescription className="text-[#324c48]">
                Select only the areas and updates you're interested in
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Areas Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPinIcon className="h-5 w-5 text-[#D4A017]" />
                  <h3 className="text-lg font-semibold text-[#3f4f24]">
                    Property Areas
                  </h3>
                </div>
                <p className="text-sm text-[#324c48] mb-4">
                  Choose the areas where you'd like to receive property updates:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AREAS.map((area) => (
                    <div key={area.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`area-${area.id}`}
                        checked={preferences.preferredAreas.includes(area.value)}
                        onCheckedChange={() => handleAreaChange(area.value)}
                        className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                      />
                      <Label
                        htmlFor={`area-${area.id}`}
                        className="text-[#324c48] cursor-pointer font-medium"
                      >
                        {area.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Email Types Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BellIcon className="h-5 w-5 text-[#D4A017]" />
                  <h3 className="text-lg font-semibold text-[#3f4f24]">
                    Email Types
                  </h3>
                </div>
                <p className="text-sm text-[#324c48] mb-4">
                  Choose what types of emails you'd like to receive:
                </p>
                <div className="space-y-4">
                  {EMAIL_TYPES.map((emailType) => {
                    const IconComponent = emailType.icon;
                    return (
                      <div key={emailType.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#FDF8F2] border border-[#324c48]/10">
                        <Checkbox
                          id={`email-${emailType.id}`}
                          checked={preferences[emailType.id] === 'available'}
                          onCheckedChange={() => handleEmailTypeChange(emailType.id)}
                          className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017] mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`email-${emailType.id}`}
                            className="text-[#324c48] cursor-pointer font-medium flex items-center gap-2"
                          >
                            <IconComponent className="h-4 w-4 text-[#D4A017]" />
                            {emailType.label}
                          </Label>
                          <p className="text-xs text-[#324c48]/70 mt-1">
                            {emailType.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="flex-1 bg-[#3f4f24] hover:bg-[#324c48] text-white py-3 font-semibold"
                >
                  {saving ? 'Saving...' : 'Save My Preferences'}
                </Button>
                
                <Button
                  onClick={handleCompleteUnsubscribe}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 py-3 font-semibold"
                >
                  Unsubscribe from All
                </Button>
              </div>

              {/* Contact Information */}
              <div className="text-center text-sm text-[#324c48]/70 pt-4 border-t border-[#324c48]/10">
                <p className="flex items-center justify-center gap-1">
                  <HeartIcon className="h-4 w-4" />
                  Still have questions? Contact us at{' '}
                  <a href="mailto:support@landivo.com" className="text-[#D4A017] hover:underline">
                    support@landivo.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}