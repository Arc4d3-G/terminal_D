import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setMessage('Verification token is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}verify?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed.');
        }

        setMessage(data.message); // Success message from backend
      } catch (error) {
        setMessage((error as Error).message || 'An error occurred during verification.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return <div>{loading ? <p>Verifying your email...</p> : <p>{message}</p>}</div>;
};

export default Verify;
