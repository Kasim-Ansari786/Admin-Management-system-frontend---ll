// src/components/dashboards/LoginForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner'; 
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, LogIn as LogInIcon } from 'lucide-react';

const LoginForm = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('coach'); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const { login, error: authError } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password, role); 

    if (result.error) {
        toast.error("Login Failed", { description: result.error });
    } else {
        toast.success("Login Successful", { description: "Redirecting to dashboard..." });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <LogInIcon className="h-6 w-6 text-primary" />
            Sign In
        </CardTitle>
        <CardDescription className='text-center'>
            Enter your credentials to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authError && (
            <p className="text-sm font-medium text-red-600 text-center mb-4 p-2 bg-red-50 rounded-lg border border-red-200">
                {authError}
            </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
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

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-primary-dark transition-smooth"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Switch to Signup */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary hover:text-primary-dark"
              onClick={onSwitchToSignup}
            >
              Sign up here
            </Button>
          </p>          
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;