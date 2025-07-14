import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';

const VipAlreadyMember = ({ isOpen, onClose }) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    
    if (!validateEmail(inviteEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    // For now, just show a success message
    alert('Invite functionality coming soon!');
    setInviteEmail('');
  };

  const handleClose = () => {
    setInviteEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-[#3f4f24]">
            Good News!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-6">
          <p className="text-[#324c48] mb-6">
            You are already in the VIP list and have access to all exclusive benefits!
          </p>
          
          <div className="text-left">
            <h4 className="font-semibold text-[#3f4f24] mb-2">
              Looking to invite someone?
            </h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@email.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleInvite}
                className="bg-[#D4A017] hover:bg-[#D4A017]/90 text-white px-4 py-2"
              >
                Invite
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VipAlreadyMember;