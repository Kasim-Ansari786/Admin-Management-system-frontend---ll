import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess  = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-field flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-card border-white/20 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Payment Successful!</CardTitle>
            <CardDescription className="text-white/80">
              Thank you for your payment. Your training plan is now active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 mb-6">
              You will receive a confirmation email shortly with your payment details and next steps.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="w-full glass-button"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;