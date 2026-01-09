import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ONBOARDING_KEY = 'medflow_onboarding_complete';

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const userKey = `${ONBOARDING_KEY}_${user.id}`;
      const isComplete = localStorage.getItem(userKey) === 'true';
      
      if (!isComplete) {
        // Small delay to let the dashboard render first
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    setIsLoading(false);
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      const userKey = `${ONBOARDING_KEY}_${user.id}`;
      localStorage.setItem(userKey, 'true');
      setShowOnboarding(false);
    }
  };

  const resetOnboarding = () => {
    if (user) {
      const userKey = `${ONBOARDING_KEY}_${user.id}`;
      localStorage.removeItem(userKey);
      setShowOnboarding(true);
    }
  };

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading,
  };
}
