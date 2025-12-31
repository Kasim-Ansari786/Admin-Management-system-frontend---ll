import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-field flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-card border-white/20 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Payment Canceled</CardTitle>
            <CardDescription className="text-white/80">
              Your payment was canceled. No charges were made to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 mb-6">
              You can try again anytime or contact support if you need assistance.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')}
                className="w-full glass-button"
              >
                Return to Dashboard
              </Button>
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCanceled;