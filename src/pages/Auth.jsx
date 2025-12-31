
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';


const Auth  = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();




useEffect(() => {
  if (user) navigate('/');
}, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-auth flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-primary-foreground/5 rounded-full blur-2xl animate-float" />

        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary-foreground/20 rounded-full animate-float" />
        <div
          className="absolute top-1/2 left-1/6 w-3 h-3 bg-primary-foreground/30 rounded-full animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-5 h-5 bg-primary-foreground/20 rounded-full animate-float"
          style={{ animationDelay: "0.5s" }}
        />

        <div className="absolute -top-20 -right-20 w-80 h-80 border border-primary-foreground/10 rounded-3xl rotate-12 glass-effect" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 border border-primary-foreground/10 rounded-3xl -rotate-12 glass-effect" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg animate-float">
            <span className="text-2xl font-bold text-primary-foreground">⚽</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Management System
          </h1>
          <p className="text-white/80">
            Made in India with ❤️ by ComData Innovation
          </p>
        </div>

        {/* Forms */}
        <div className="relative">
          {isLogin ? (
            <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © 2024 Admin Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Auth;
