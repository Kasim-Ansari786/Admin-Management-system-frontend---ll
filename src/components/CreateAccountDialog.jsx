import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  User,
  Shield,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { signupUser } from "../../api";

// --- Password Validation Rules ---
const passwordRules = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

const CreateAccountDialog = ({ open = false, onOpenChange = () => {}, onAccountCreated, onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const { toast: uiToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("staff");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // --- Password Validation Logic ---
  const validatePassword = (pw) => {
    return {
      isLongEnough: pw.length >= passwordRules.minLength,
      hasUpperCase: passwordRules.hasUpperCase.test(pw),
      hasLowerCase: passwordRules.hasLowerCase.test(pw),
      hasNumber: passwordRules.hasNumber.test(pw),
      hasSpecialChar: passwordRules.hasSpecialChar.test(pw),
      isMatched: pw === confirmPassword,
      isValid:
        pw.length >= passwordRules.minLength &&
        passwordRules.hasUpperCase.test(pw) &&
        passwordRules.hasLowerCase.test(pw) &&
        passwordRules.hasNumber.test(pw) &&
        passwordRules.hasSpecialChar.test(pw),
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  // --- Helper for Role Description ---
  const getRoleDescription = (role) => {
    switch (role) {
      case "parent":
        return "Enroll your child and track their progress.";
      case "coach":
        return "Apply to join our coaching team (requires admin approval).";
      case "staff":
        return "Request administrative access (requires approval).";
      default:
        return "";
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !role) {
      uiToast({
        title: "Validation Failed",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordValidation.isValid) {
      uiToast({
        title: "Password is too weak",
        description: "Please ensure your password meets all criteria.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordsMatch) {
      uiToast({
        title: "Validation Failed",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userData = { name, email, password, role };
      const result = await signupUser(userData);
      if (result.data) {
        toast({
          title: "Account Created",
          description: "Your account has been created. You can now log in.",
        }); 
        try {
          const accountObj = {
            id: result.data.id || result.data.user_id || `user-${Date.now()}`,
            full_name: result.data.full_name || result.data.name || name,
            email: result.data.email || email,
            role: result.data.role || role,
            created_at: result.data.created_at || new Date().toISOString(),
          };
          if (typeof onAccountCreated === "function") onAccountCreated(accountObj);
        } catch (e) {
        }
        resetForm();
        onOpenChange(false);
      } else {
        toast({
          title: "Signup Failed",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (apiError) {
      toast({
        title: "Signup Error",
        description: apiError.message || "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Component for Password Strength Indicators ---
  const PasswordStrengthIndicator = () => (
    <ul className="text-xs text-muted-foreground p-2 border rounded-md mt-1 space-y-1 bg-secondary/20">
      <li className="flex items-center gap-1">
        {passwordValidation.isLongEnough ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
        Minimum {passwordRules.minLength} characters
      </li>
      <li className="flex items-center gap-1">
        {passwordValidation.hasUpperCase ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
        At least one uppercase letter (A-Z)
      </li>
      <li className="flex items-center gap-1">
        {passwordValidation.hasNumber ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
        At least one number (0-9)
      </li>
      <li className="flex items-center gap-1">
        {passwordValidation.hasSpecialChar ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
        At least one special character (!@#$...)
      </li>
    </ul>
  );

  // --- Component Render ---
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>Fill in the details to create a new user account.</DialogDescription>
        </DialogHeader>

        <Card className="border-none shadow-none">
          <CardContent className="p-0 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
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

              {/* Email */}
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

              {/* Role Selection */}
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
                        <span>Teacher</span>
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 transition-smooth"
                    required
                    aria-invalid={password.length > 0 && !passwordValidation.isValid}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 transition-smooth"
                    required
                    aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
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

              {/* Submit Button */}
              <div className="flex justify-end w-full mt-6">
                <Button
                  type="submit"
                  className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white shadow-sm rounded-xl px-5 transition-all border-none font-medium"
                  disabled={isLoading || !passwordValidation.isValid || !passwordsMatch || !role}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccountDialog;
