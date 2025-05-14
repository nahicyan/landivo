"use client";

import React, { useState } from "react";
import { MoreVertical, Plus, X, Edit } from "lucide-react";
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

// Profile Management Dialog Component
const ProfileManagementDialog = ({ user, isOpen, onClose, onSuccess }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProfileId, setNewProfileId] = useState("");

  // Load user's profiles
  React.useEffect(() => {
    if (isOpen) {
      // Set current user's profiles
      setProfiles(user.allowedProfiles || []);
    }
  }, [isOpen, user]);

  const handleAddProfile = () => {
    if (!newProfileId) return;
    
    const updatedProfiles = [...profiles, newProfileId];
    
    // Use the api object directly
    api.put(`/user/${user.id}`, { allowedProfiles: updatedProfiles })
      .then(() => {
        setProfiles(updatedProfiles);
        setNewProfileId("");
        toast.success("Profile added successfully");
        if (onSuccess) onSuccess();
      })
      .catch(error => {
        console.error("Failed to add profile:", error);
        toast.error("Failed to add profile");
      });
  };

  const handleRemoveProfile = (profileId) => {
    const updatedProfiles = profiles.filter(id => id !== profileId);
    
    // Use the api object directly
    api.put(`/user/${user.id}`, { allowedProfiles: updatedProfiles })
      .then(() => {
        setProfiles(updatedProfiles);
        toast.success("Profile removed successfully");
        if (onSuccess) onSuccess();
      })
      .catch(error => {
        console.error("Failed to remove profile:", error);
        toast.error("Failed to remove profile");
      });
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
            <Input
              placeholder="Enter profile ID"
              value={newProfileId}
              onChange={(e) => setNewProfileId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddProfile} disabled={!newProfileId}>
              Add
            </Button>
          </div>
          
          <Label>Current Profiles</Label>
          <div className="mt-2 space-y-2">
            {profiles.length === 0 ? (
              <p className="text-gray-500 text-sm">No profiles assigned</p>
            ) : (
              profiles.map((profileId) => (
                <div key={profileId} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span>{profileId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProfile(profileId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
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