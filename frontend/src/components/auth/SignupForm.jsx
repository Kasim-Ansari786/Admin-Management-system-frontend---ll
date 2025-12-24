import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Shield, Users, CheckCircle, XCircle } from 'lucide-react';
import { signupUser } from '../../../api'; 

// --- Password Validation Rules ---
const passwordRules = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

const Signup = ({ onSwitchToLogin }) => {
  // ⚠️ CRITICAL CHANGE: Removed tenantId state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('parent'); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { toast } = useToast();

  // --- Password Validation Logic ---
  const validatePassword = (pw) => {
    return {
      isLongEnough: pw.length >= passwordRules.minLength,
      hasUpperCase: passwordRules.hasUpperCase.test(pw),
      hasLowerCase: passwordRules.hasLowerCase.test(pw),
      hasNumber: passwordRules.hasNumber.test(pw),
      hasSpecialChar: passwordRules.hasSpecialChar.test(pw),
      isMatched: pw === confirmPassword,
      isValid: (
        pw.length >= passwordRules.minLength &&
        passwordRules.hasUpperCase.test(pw) &&
        passwordRules.hasLowerCase.test(pw) &&
        passwordRules.hasNumber.test(pw) &&
        passwordRules.hasSpecialChar.test(pw)
      ),
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  // --- Helper for Role Description ---
  const getRoleDescription = (role) => {
    switch (role) {
      case 'parent':
        return 'Enroll your child and track their progress.';
      case 'coach':
        return 'Apply to join our coaching team (requires admin approval).';
      case 'staff':
        return 'Request administrative access (requires approval).';
      default:
        return '';
    }
  };
  
  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation: Check for required fields (Tenant ID check removed)
    if (!name || !email || !password || !confirmPassword || !role) {
      toast({
        title: 'Validation Failed',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // 2. Client-Side Validation: Check password strength
    if (!passwordValidation.isValid) {
      toast({
        title: 'Password is too weak',
        description: 'Please ensure your password meets all criteria.',
        variant: 'destructive',
      });
      return;
    }
    
    // 3. Client-Side Validation: Check password match
    if (!passwordsMatch) {
      toast({
        title: 'Validation Failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    // Start loading state
    setIsLoading(true);

    try {
      // 4. API Call
      const userData = { name, email, password, role };
      
      const result = await signupUser(userData);

      // 5. Handle API Response
      if (result.data) { 
        toast({
          title: 'Account Created',
          description: 'Your account has been created. You can now log in.',
        });
        // Optional: Clear the form fields upon successful signup
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('parent'); 
      } else {
        // Handle error from the API (e.g., email already exists, network error)
        toast({
          title: 'Signup Failed',
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

  // --- Component for Password Strength Indicators ---
  const PasswordStrengthIndicator = () => (
    <ul className="text-xs text-muted-foreground p-2 border rounded-md mt-1 space-y-1 bg-secondary/20">
      <li className="flex items-center gap-1">
        {passwordValidation.isLongEnough ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
        Minimum {passwordRules.minLength} characters
      </li>
      <li className="flex items-center gap-1">
        {passwordValidation.hasUpperCase ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
        At least one uppercase letter (A-Z)
      </li>
      <li className="flex items-center gap-1">
        {passwordValidation.hasNumber ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
        At least one number (0-9)
      </li>
      <li className="flex items-center gap-1">
        {passwordValidation.hasSpecialChar ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
        At least one special character (!@#$...)
      </li>
    </ul>
  );

  // --- Component Render ---
  return (
    <Card className="space-y-4">
      {/* <CardHeader className="space-y-4 text-center bg-gradient-primary rounded-t-xl text-primary-foreground">
        <CardTitle className="text-xlbold">Admin Management System</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Create your account to get started
        </CardDescription>
      </CardHeader> */}
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
                    <span>Admin</span>
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
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 transition-smooth"
                required
                aria-invalid={password.length > 0 && !passwordValidation.isValid ? "true" : "false"}
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
            {password.length > 0 && <PasswordStrengthIndicator />}
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
                aria-invalid={confirmPassword.length > 0 && !passwordsMatch ? "true" : "false"}
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
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Passwords do not match.
              </p>
            )}
          </div>
        
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-primary-dark transition-smooth"
            disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Switch to Login Link */}
        {/* <div className="mt-6 text-center">
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
        </div> */}
      </CardContent>
    </Card>
  );
};

export default Signup;
