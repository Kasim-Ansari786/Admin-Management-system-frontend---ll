import React, { useState, useRef, useEffect } from "react";
import {
  LogOut,
  User,
  Mail,
  Shield,
  LayoutDashboard,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updatedprofiledata } from "../../../api";

const API_URL = "http://localhost:5001";
export const DashboardHeader = ({
  title = "One Admin Dashboard",
  subtitle = "Welcome back! Here's your academy overview.",
}) => {

  const { toast } = useToast();
  const { user, logout, updateAvatar } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [logoUrl, setLogoUrl] = useState(user?.logo || null);
  const fileInputRef = useRef(null);

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (typeof path !== "string") return null;
    if (path.startsWith("data:")) return path;
    if (path.startsWith("http")) return path;
    try {
      const base = API_URL.replace(/\/$/, "");
      const cleaned = path.replace(/\\/g, "/").replace(/^\/*/, "");
      return `${base}/${cleaned}`;
    } catch (e) {
      return path;
    }
  };

  useEffect(() => {
    if (user?.logo) {
      setLogoUrl(user.logo);
    }
  }, [user?.logo]);

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      toast({ title: "Logged out", description: "Successfully logged out." });
    } catch (error) {
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await updatedprofiledata(formData);
      const newPath = res?.data?.path;

      if (newPath) {
        setLogoUrl(newPath);
        if (typeof updateAvatar === "function") updateAvatar(newPath);
      }

      toast({ title: "Profile image updated" });
      setIsModalOpen(false);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="space-y-0">
      <header className="w-full flex items-center justify-between p-6 bg-[#1A9CFF] rounded-xl border-b border-white/10 shadow-md">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="text-blue-50 font-medium opacity-90">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <Button
            size="sm"
            className="hidden md:flex bg-white/20 text-white hover:bg-white/30"
            onClick={() => (window.location.href = "/staff")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Staff Dashboard
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-11 w-11 rounded-full p-0 hover:bg-white/10"
              >
                <div className="h-10 w-10 rounded-full border-2 border-white/20 bg-white flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                        <img
                          src={getFullImageUrl(logoUrl || user?.logo)}
                          alt="User Logo"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            try { e.currentTarget.removeAttribute('src'); } catch(_){}
                            setLogoUrl(null);
                          }}
                        />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-[#1A9CFF]" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-72 mt-2" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-3 p-1">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full border border-primary/10 bg-[#1A9CFF] flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img
                          src={getFullImageUrl(logoUrl)}
                          alt="Logo"
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.onerror = null; try { e.currentTarget.removeAttribute('src'); } catch(_){}; setLogoUrl(null); }}
                        />
                      ) : (
                        <span className="text-white text-lg font-bold">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold">
                        {user?.name || "User Name"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                        {user?.role || "Staff"}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-1">
                <DropdownMenuItem className="gap-3 py-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">
                    {user?.email || "No email"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 py-2.5 cursor-pointer"
                  onSelect={() => setIsModalOpen(true)}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-3 py-3 text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-bold">Logout System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* --- LOGO UPLOAD MODAL --- */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setPreviewUrl(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Logo</DialogTitle>
            <DialogDescription>
              Upload a new image for your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="relative h-32 w-32 rounded-full border-4 border-gray-100 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : logoUrl ? (
                <img
                  src={getFullImageUrl(logoUrl)}
                  alt="Current"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-slate-300" />
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? "Change Selection" : "Select New Logo"}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadLogo}
              disabled={!previewUrl || isUploading}
              className="bg-[#1A9CFF] hover:bg-[#1A9CFF]/90"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
