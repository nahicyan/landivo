// ProfileReassignmentModal.jsx
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";

const ProfileReassignmentModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onConfirm 
}) => {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchProfileData();
    }
  }, [isOpen, user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Get properties using this profile
      const propertiesResponse = await api.get(`/user/${user.id}/properties`);
      setProperties(propertiesResponse.data || []);
      
      // Get available profiles for reassignment
      const profilesResponse = await api.get('/user/property-profiles');
      // Filter out the current user being disabled
      const availableProfiles = profilesResponse.data.filter(
        profile => profile.id !== user.id
      );
      setProfiles(availableProfiles);
      
      if (availableProfiles.length > 0) {
        setSelectedProfileId(availableProfiles[0].id);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedProfileId) return;
    
    setProcessing(true);
    try {
      await api.put(`/user/${user.id}/reassign-properties`, {
        newProfileId: selectedProfileId
      });
      onConfirm();
    } catch (error) {
      console.error("Error reassigning properties:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reassign Properties Before Disabling User</DialogTitle>
          <DialogDescription>
            This user's profile is associated with {properties.length} properties. 
            Please select another profile to reassign these properties before disabling.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-4 my-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Select New Profile:</span>
                <Select 
                  value={selectedProfileId} 
                  onValueChange={setSelectedProfileId}
                  disabled={profiles.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-medium mb-2">Properties to be reassigned:</h3>
                <div className="max-h-64 overflow-y-auto border rounded">
                  {properties.length > 0 ? (
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {properties.map((property, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm">
                              {property.streetAddress}, {property.city}, {property.state} {property.zip}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-4 text-gray-500">No properties found.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!selectedProfileId || processing || profiles.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reassign and Disable"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileReassignmentModal;