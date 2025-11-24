import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCard, Check, Star } from 'lucide-react';

const StripePayment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Training',
      price: 99,
      currency: 'USD',
      description: 'Perfect for beginners',
      features: [
        '2 training sessions per week',
        'Basic equipment provided',
        'Monthly progress report',
        'Access to academy facilities'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium Training',
      price: 199,
      currency: 'USD',
      description: 'Most popular choice',
      features: [
        '4 training sessions per week',
        'Premium equipment provided',
        'Weekly progress reports',
        'Access to all facilities',
        '1-on-1 coaching sessions',
        'Match opportunities'
      ],
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite Program',
      price: 399,
      currency: 'USD',
      description: 'For serious athletes',
      features: [
        'Daily training sessions',
        'Professional equipment',
        'Daily progress tracking',
        'Full facility access',
        'Personal trainer',
        'Competitive matches',
        'Nutrition consultation',
        'Mental performance coaching'
      ],
      popular: false
    }
  ];

  const handlePayment = async (planId, amount) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Show success message (dummy payment)
      toast({
        title: "Payment Processed (Demo)",
        description: `Successfully processed payment of $${amount} for ${planId} plan.`,
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Training Plan</h2>
        <p className="text-muted-foreground">Select the perfect plan for your child's football journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handlePayment(plan.id, plan.price)}
                disabled={isLoading}
                className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Choose Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StripePayment;