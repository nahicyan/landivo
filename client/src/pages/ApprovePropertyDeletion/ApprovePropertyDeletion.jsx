import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import axios from 'axios';

const ApprovePropertyDeletion = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const hasRequested = useRef(false); // Prevent duplicate requests

  useEffect(() => {
    const approveDeletion = async () => {
      // Prevent duplicate requests
      if (hasRequested.current) return;
      hasRequested.current = true;

      try {
        const response = await axios.post(
          `https://api.landivo.com/residency/approve-deletion/${token}`,
          {},
          { timeout: 30000 } // 30 second timeout
        );
        
        setStatus('success');
        setMessage(response.data.message || 'Property deleted successfully');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
      } catch (error) {
        setStatus('error');
        
        if (error.response?.status === 400 || error.response?.status === 404) {
          setMessage(error.response.data.message);
        } else {
          setMessage('Failed to delete property. Please try again.');
        }
      }
    };

    approveDeletion();
  }, [token, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={3}
      bgcolor="#f5f5f5"
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} sx={{ mb: 3, color: '#324c48' }} />
          <Typography variant="h5">Processing deletion request...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait, do not refresh the page
          </Typography>
        </>
      )}
      
      {status === 'success' && (
        <Box textAlign="center">
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              margin: '0 auto 24px',
              borderRadius: '50%',
              bgcolor: '#4caf50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography fontSize={48} color="white">✓</Typography>
          </Box>
          <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem' }}>
            {message}
          </Alert>
          <Typography variant="body1" color="text.secondary">
            Redirecting to home page...
          </Typography>
        </Box>
      )}
      
      {status === 'error' && (
        <Box textAlign="center">
          <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
            {message}
          </Alert>
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 2, 
              cursor: 'pointer', 
              color: '#324c48',
              textDecoration: 'underline' 
            }}
            onClick={() => navigate('/')}
          >
            Return to Home
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ApprovePropertyDeletion;