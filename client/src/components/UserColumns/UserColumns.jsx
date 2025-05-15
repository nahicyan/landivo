"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { MoreVertical, Plus, X, Edit, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { api } from "@/utils/api"; // Use the api object directly

// Fixed ProfileManagementDialog component with proper API handling
const ProfileManagementDialog = ({ user, isOpen, onClose, onSuccess }) => {
  const [profiles, setProfiles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  
  // Load all users and current user's profiles
  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
      
      // Initialize profiles with current allowed profiles
      setProfiles(user.allowedProfiles?.map(id => ({ id })) || []);
    }
  }, [isOpen, user]);
  
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Use the api object directly - avoid path duplication
      const response = await api.get('/user/all');
      setAllUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    
    // Check if profile is already added
    if ((user.allowedProfiles || []).includes(selectedUserId)) {
      toast.warning("This profile is already assigned to the user");
      setLoading(false);
      return;
    }
    
    // Get current profiles and add the new one
    const updatedProfileIds = [...(user.allowedProfiles || []), selectedUserId];
    
    try {
      // Log what we're sending to the API
      console.log(`Updating user ${user.id} with allowedProfiles:`, updatedProfileIds);
      
      // Send only the allowedProfiles field
      await api.put(`/user/${user.id}/profiles`, { 
        allowedProfiles: updatedProfileIds 
      });
      
      // Update local state
      const selectedUser = allUsers.find(u => u.id === selectedUserId);
      if (selectedUser) {
        setProfiles([...profiles, { 
          id: selectedUserId,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          email: selectedUser.email
        }]);
      }
      
      setSelectedUserId("");
      toast.success("Profile added successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to add profile:", error);
      // More detailed error logging
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(`Failed to add profile: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfile = async (profileId) => {
    setLoading(true);
    
    // Filter out the profile to remove
    const updatedProfileIds = (user.allowedProfiles || []).filter(id => id !== profileId);
    
    try {
      // Use a specific endpoint for profile updates
      await api.put(`/user/${user.id}/profiles`, { 
        allowedProfiles: updatedProfileIds 
      });
      
      // Update local state
      setProfiles(profiles.filter(profile => profile.id !== profileId));
      toast.success("Profile removed successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to remove profile:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(`Failed to remove profile: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Profiles for {user.firstName} {user.lastName}</DialogTitle>
          <DialogDescription>
            Add or remove profiles that this user can access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex gap-2 mb-4">
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={loading ? "Loading users..." : "Select a user profile"} />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName || ''} {user.lastName || ''} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddProfile} disabled={!selectedUserId || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
          
          <Label>Current Profiles</Label>
          <div className="mt-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Loading profiles...</span>
              </div>
            ) : profiles.length === 0 ? (
              <p className="text-gray-500 text-sm">No profiles assigned</p>
            ) : (
              profiles.map((profile) => (
                <div key={profile.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <span className="font-medium">{profile.firstName || ''} {profile.lastName || ''}</span>
                    {profile.email && <span className="text-sm text-gray-500 ml-2">({profile.email})</span>}
                    {!profile.email && <span className="text-sm text-gray-500 ml-2">(ID: {profile.id})</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProfile(profile.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const columns = [
  {
    accessorKey: "avatarUrl",
    header: "Avatar",
    cell: ({ row }) => {
      const user = row.original;
      const imageSrc = user.avatarUrl || "/default-avatar.jpg";
      return (
        <img
          src={imageSrc}
          alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || "User"}
          className="w-10 h-10 object-cover rounded-full"
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return <span>{fullName || "No Name"}</span>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      return <span>{row.original.phone || "—"}</span>;
    },
  },
  {
    accessorKey: "profileRole",
    header: "Profile Role",
    cell: ({ row }) => {
      return <span>{row.original.profileRole || "—"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      const statusClass = isActive 
        ? "bg-green-100 text-green-800" 
        : "bg-red-100 text-red-800";
      
      return (
        <Badge className={`px-2 py-1 ${statusClass}`}>
          {isActive ? "Active" : "Disabled"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      const bgColor = role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";

      return (
        <Badge className={`px-2 py-1 ${bgColor}`}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "profiles",
    header: "Profiles",
    cell: ({ row }) => {
      const user = row.original;
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      
      return (
        <>
          <div className="flex items-center">
            <Badge className="bg-gray-100 text-gray-800 mr-2">
              {user.allowedProfiles?.length || 0}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
              title="Manage Profiles"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          
          <ProfileManagementDialog 
            user={user}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSuccess={() => {
              // Refresh the table data
              window.location.reload();
            }}
          />
        </>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}`}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}/edit`}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => row.original.toggleStatus()}>
              {row.original.isActive ? "Disable User" : "Enable User"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Only show delete option for non-admin users */}
            {user.role !== "ADMIN" && (
              <DropdownMenuItem onClick={() => console.log("Delete", user.id)} className="text-red-600">
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];