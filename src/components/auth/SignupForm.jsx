import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, User, Shield, Users } from 'lucide-react';
// Path Fix: import the correct signup API function
import { signupUser } from '../../../api';

// Note: I will assume the 'signup' function from useAuth is a wrapper 
// for state management and local session handling. I'll pass the 
// API call result to it, or you can replace the useAuth call entirely.
// For now, I'm calling the API directly and using local state for loading.

const SignupForm = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // FIX: This local state definition is now the single source of truth for loading.
  const [isLoading, setIsLoading] = useState(false); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('parent'); // default role
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // FIX: Removed the redundant and conflicting destructuring from useAuth().
  // If you need other values from useAuth(), assign the hook result to a variable:
  // const auth = useAuth(); 
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation (omitted for brevity, assume it's correct)
    if (!name || !email || !password || !confirmPassword || !role) {
      // ... validation toast ...
      return;
    }

    // ... password match/length validation ...
    
    // Start loading state
    setIsLoading(true); 

    try {
      // 2. Call the new signupUser API function
      const userData = { name, email, password, role };
      
      // The API call is here:
      const result = await signupUser(userData);

      // 3. Handle API Response
      // FIX: Check for the 'data' property being present (and 'error' being null)
      // instead of checking for a non-existent 'success' property.
      if (result.data) { 
        toast({
          title: 'Account Created',
          description: 'Please check your email to confirm your account.',
        });
        // Optional: Clear the form fields upon successful signup
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('parent'); 
      } else {
        // Handle error from the API (e.g., email already exists, failed validation, or network error)
        toast({
          title: 'Signup Failed',
          // Use the 'error' property from the result object
          description: result.error || 'An unexpected error occurred.', 
          variant: 'destructive',
        });
      }
    } catch (apiError) {
      // Catch unexpected errors that slip past the api.js error handling
      toast({
        title: 'Signup Error',
        description: apiError.message || 'Could not connect to the server.',
        variant: 'destructive',
      });
    } finally {
      // Stop loading state
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'parent':
        return 'Enroll your child and track their progress';
      case 'coach':
        return 'Apply to join our coaching team';
      case 'staff':
        return 'Request administrative access';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-card">
      <CardHeader className="space-y-4 text-center bg-gradient-primary rounded-t-xl text-primary-foreground">
        <CardTitle className="text-2xl font-bold">Join Football Academy</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Create your account to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="transition-smooth"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="transition-smooth"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Account Type</Label>
            <Select value={role} onValueChange={(value) => setRole(value)}>
              <SelectTrigger className="transition-smooth">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Parent</span>
                  </div>
                </SelectItem>
                <SelectItem value="coach">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Coach</span>
                  </div>
                </SelectItem>
                <SelectItem value="staff">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Staff</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getRoleDescription(role)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 transition-smooth"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 transition-smooth"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-primary-dark transition-smooth"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary hover:text-primary-dark"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;