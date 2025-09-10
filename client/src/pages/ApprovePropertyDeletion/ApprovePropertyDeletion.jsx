import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import axios from 'axios';

const ApprovePropertyDeletion = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const approveDeletion = async () => {
      try {
        const response = await axios.post(
          `https://api.landivo.com/residency/approve-deletion/${token}`
        );
        
        setStatus('success');
        setMessage(response.data.message || 'Property deleted successfully');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Failed to delete property. This link may be invalid or expired.'
        );
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
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} sx={{ mb: 3, color: '#324c48' }} />
          <Typography variant="h5">Processing deletion request...</Typography>
        </>
      )}
      
      {status === 'success' && (
        <>
          <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem' }}>
            {message}
          </Alert>
          <Typography variant="body1" color="text.secondary">
            Redirecting to home page...
          </Typography>
        </>
      )}
      
      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ mb: 3 }}>
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
        </>
      )}
    </Box>
  );
};

export default ApprovePropertyDeletion;