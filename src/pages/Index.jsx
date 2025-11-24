import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ParentDashboard from '@/components/dashboards/ParentDashboard';
import CoachDashboard from '@/components/dashboards/CoachDashboard';
import StaffDashboard from '@/components/dashboards/StaffDashboard';
import OnboardingForm from '@/components/parent/OnboardingForm';
import { Loader2 } from 'lucide-react';
//import './index.css';

const Index = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      if (!authLoading && !user) {
        navigate('/auth');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, navigate, authLoading]);

  useEffect(() => {
    const checkOnboardingStatus = () => {
      if (user && user.role === 'parent') {
        // Check localStorage for onboarding completion
        const onboardingData = localStorage.getItem('dummyOnboarding');
        const completed = onboardingData ? JSON.parse(onboardingData)[user.id] : false;
        setNeedsOnboarding(!completed);
      }
      setCheckingOnboarding(false);
    };

    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  if (authLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // Show onboarding form for parents who haven't completed it
  if (user.role === 'parent' && needsOnboarding) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'parent':
        return <ParentDashboard />;
      case 'coach':
        return <CoachDashboard />;
      case 'staff':
        return <StaffDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Index;