import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const useVehicleGuard = () => {
  const [hasVehicles, setHasVehicles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/vehiculos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVehicleCount(data.length);
          setHasVehicles(data.length > 0);
        }
      } catch (err) {
        console.error('Error fetching vehicles for guard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  return { hasVehicles, loading, vehicleCount };
};
