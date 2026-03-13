import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  LogIn as LogInIcon,
  User,
  Users,
  Shield,
} from "lucide-react";

const LoginForm = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff"); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Normalize email and role to lowercase before sending to API
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.toLowerCase();

    const result = await login(normalizedEmail, password, normalizedRole);

    if (result.error) {
      toast.error("Login Failed", { description: result.error });
    } else {
      toast.success("Login Successful", {
        description: "Redirecting to dashboard...",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 w-full gradient-hero overflow-y-auto">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-8 animate-fade-in w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-1">
            Admin Management System
          </h1>
          <p className="text-white/80 font-medium">
            Made In India With ❤️ By ComData Innovation
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl border-0 animate-slide-up bg-white/95 backdrop-blur-sm mb-8">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mb-2 shadow-glow">
              <LogInIcon className="h-7 w-7 text-black" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground font-medium">
                  Select Your Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    id="role"
                    className="w-full h-12 transition-smooth border-input focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="capitalize">Teacher</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="parent">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="capitalize">Parent</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="capitalize">Staff</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email@Example.Com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 transition-smooth border-input focus:ring-2 focus:ring-primary/30 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-foreground font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12 transition-smooth border-input focus:ring-2 focus:ring-primary/30 bg-white"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 gradient-primary hover:opacity-90 transition-smooth shadow-lg text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <footer className="mt-8 text-primary-foreground/70 text-sm animate-fade-in text-center">
          <p>© 2026 Admin Portal. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginForm;