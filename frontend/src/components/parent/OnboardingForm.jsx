import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User } from 'lucide-react';

const OnboardingForm = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    childPosition: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
    previousExperience: '',
    preferredCenter: '',
    preferredBatch: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (
      !formData.childName ||
      !formData.childAge ||
      !formData.emergencyContactName ||
      !formData.emergencyContactPhone
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate saving delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Save to localStorage
      const onboardingData = localStorage.getItem('dummyOnboarding');
      const allData = onboardingData ? JSON.parse(onboardingData) : {};
      allData[user.id] = {
        ...formData,
        completed: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('dummyOnboarding', JSON.stringify(allData));

      toast({
        title: 'Onboarding Complete',
        description: 'Your information has been saved successfully!',
      });

      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-field flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-elegant animate-float">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to the Academy</h1>
          <p className="text-white/80">Let's get your child started with their football journey</p>
        </div>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Child Information</CardTitle>
            <CardDescription className="text-white/80">
              Please provide your child's details to complete the registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childName" className="text-white">
                    Child's Name *
                  </Label>
                  <Input
                    id="childName"
                    type="text"
                    value={formData.childName}
                    onChange={(e) => handleChange('childName', e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childAge" className="text-white">
                    Age *
                  </Label>
                  <Input
                    id="childAge"
                    type="number"
                    min="4"
                    max="18"
                    value={formData.childAge}
                    onChange={(e) => handleChange('childAge', e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="childPosition" className="text-white">
                  Preferred Position
                </Label>
                <Select
                  value={formData.childPosition}
                  onValueChange={(value) => handleChange('childPosition', value)}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select preferred position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                    <SelectItem value="any">Any Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName" className="text-white">
                    Emergency Contact Name *
                  </Label>
                  <Input
                    id="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      handleChange('emergencyContactName', e.target.value)
                    }
                    className="glass-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone" className="text-white">
                    Emergency Contact Phone *
                  </Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      handleChange('emergencyContactPhone', e.target.value)
                    }
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalConditions" className="text-white">
                  Medical Conditions or Allergies
                </Label>
                <Textarea
                  id="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={(e) =>
                    handleChange('medicalConditions', e.target.value)
                  }
                  className="glass-input"
                  placeholder="Please list any medical conditions, allergies, or special needs"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousExperience" className="text-white">
                  Previous Football Experience
                </Label>
                <Textarea
                  id="previousExperience"
                  value={formData.previousExperience}
                  onChange={(e) =>
                    handleChange('previousExperience', e.target.value)
                  }
                  className="glass-input"
                  placeholder="Tell us about your child's football background"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredCenter" className="text-white">
                    Preferred Training Center
                  </Label>
                  <Select
                    value={formData.preferredCenter}
                    onValueChange={(value) =>
                      handleChange('preferredCenter', value)
                    }
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select preferred center" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north">North Center</SelectItem>
                      <SelectItem value="south">South Center</SelectItem>
                      <SelectItem value="east">East Center</SelectItem>
                      <SelectItem value="west">West Center</SelectItem>
                      <SelectItem value="central">Central Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredBatch" className="text-white">
                    Preferred Training Time
                  </Label>
                  <Select
                    value={formData.preferredBatch}
                    onValueChange={(value) =>
                      handleChange('preferredBatch', value)
                    }
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select preferred time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">
                        Morning (9:00 AM - 11:00 AM)
                      </SelectItem>
                      <SelectItem value="afternoon">
                        Afternoon (2:00 PM - 4:00 PM)
                      </SelectItem>
                      <SelectItem value="evening">
                        Evening (5:00 PM - 7:00 PM)
                      </SelectItem>
                      <SelectItem value="weekend">
                        Weekend Sessions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full glass-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingForm;
