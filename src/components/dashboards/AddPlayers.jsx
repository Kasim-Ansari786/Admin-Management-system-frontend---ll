// --- AddPlayers.jsx ---

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// 💥 FIX 1: Import the new utility function for tenant ID
import { getLoggedInUserId } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Save,
  ArrowLeft,
  UserPlus,
  XCircle,
  LogOut,
  Users,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import { toast } from "sonner";
import { AddNewPlayerDetails } from "../../../api";

// 🚀 Token Retrieval Utility
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

const initialFormData = {
  name: "",
  father_name: "",
  mother_name: "",
  gender: "",
  date_of_birth: "",
  age: "",
  blood_group: "",
  phone_no: "",
  email_id: "",
  address: "",
  emergency_contact_number: "",
  guardian_contact_number: "",
  guardian_email_id: "",
  medical_condition: "",
  aadhar_upload_path: null,
  birth_certificate_path: null,
  profile_photo_path: null,
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const calculateAge = (dateString) => {
  if (!dateString) return "";

  const birthDate = new Date(dateString);
  const today = new Date();
  if (isNaN(birthDate)) return "";
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? String(age) : "";
};

const AddPlayerForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("authSession");

    toast.info("You have been signed out.", {
      duration: 3000,
      style: { backgroundColor: "#BBDEFB", color: "#1565C0" },
    });

    navigate("/auth");
  };

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target;
    if (
      id === "phone_no" ||
      id === "emergency_contact_number" ||
      id === "guardian_contact_number"
    ) {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [id]: numericValue }));
      return;
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [id]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, [id]: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => {
      let newState = { ...prev, [id]: value };
      if (id === "date_of_birth") {
        const age = calculateAge(value);
        newState.age = age;
      }
      return newState;
    });
  };

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setFileInputKey(Date.now());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getAuthToken();
    // 💥 FIX 2: Retrieve the Tenant ID (Login User ID)
    const tenantId = getLoggedInUserId();

    // 1. Client-Side Authentication/Tenant Check
    if (!token) {
      toast.error("Authentication token is missing. Redirecting to login...", {
        duration: 5000,
        style: {
          backgroundColor: "#FFEBEE",
          color: "#B71C1C",
          borderColor: "#F44336",
        },
      });
      setIsSubmitting(false);
      navigate("/auth");
      return;
    }

    if (!tenantId) {
      toast.error("Tenant ID is missing. Please log out and log back in.", {
        duration: 5000,
        style: {
          backgroundColor: "#FFEBEE",
          color: "#B71C1C",
          borderColor: "#F44336",
        },
      });
      setIsSubmitting(false);
      return;
    }

    if (
      formData.phone_no.length !== 10 ||
      formData.emergency_contact_number.length !== 10
    ) {
      toast.error(
        "Phone Number and Emergency Contact No. must be exactly 10 digits.",
        {
          duration: 5000,
          style: {
            backgroundColor: "#FFEBEE",
            color: "#B71C1C",
            borderColor: "#F44336",
          },
        }
      );
      setIsSubmitting(false);
      return;
    }

    // Basic required fields check (assuming Category and Name are required)
    if (!formData.name || !formData.date_of_birth) {
      toast.error(
        "Missing required player details (Name, DOB, Category, Center Name).",
        {
          duration: 5000,
          style: {
            backgroundColor: "#FFEBEE",
            color: "#B71C1C",
            borderColor: "#F44336",
          },
        }
      );
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      const value = formData[key];

      if (value instanceof File) {
        formDataToSend.append(key, value, value.name);
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(key, String(value));
      }
    });

    // 💥 FIX 3: Append the tenant_id before sending the data
    formDataToSend.append("tenant_id", tenantId);

    try {
      // 💥 FIX 4: Pass the token to the API function (as required by your previous API check)
      const response = await AddNewPlayerDetails(formDataToSend, token);

      toast.success(`Player added successfully! ${response.message || ""}`, {
        duration: 5000,
        style: {
          backgroundColor: "#E8F5E9",
          color: "#1B5E20",
          borderColor: "#4CAF50",
        },
      });
      resetForm();
      setTimeout(() => {
        navigate("/staff?tab=players");
      }, 100);
    } catch (error) {
      console.error("Submission failed", error);
      let errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to add player. Check console for details.";

      // 2. Server-Side Authentication Check (If token is invalid or expired)
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        errorMessage = "Session expired or unauthorized. Redirecting to login.";

        // Clear bad token and redirect
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("authSession");
        navigate("/auth");
      } else if (errorMessage.includes("Network Error")) {
        errorMessage =
          "Could not connect to the server. Please ensure the backend is running and the API_URL is correct.";
      } else if (errorMessage.includes('null value in column "tenant_id"')) {
        errorMessage =
          "Critical Error: Failed to link player to your account. Please log out and log back in, then try again.";
      }

      toast.error(errorMessage, {
        duration: 10000,
        style: {
          backgroundColor: "#FFEBEE",
          color: "#B71C1C",
          borderColor: "#F44336",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    navigate("/staff?tab=players");
  };

  const renderInputField = (
    id,
    label,
    type = "text",
    placeholder = "",
    maxLength = null,
    disabled = false
  ) => {
    const isDateOfBirth = id === "date_of_birth";
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={formData[id] || ""}
          onChange={
            isDateOfBirth
              ? (e) => handleSelectChange(id, e.target.value)
              : handleChange
          }
          maxLength={maxLength}
          disabled={disabled}
          // Set required fields based on database constraints
          required={
            id === "name" ||
            id === "date_of_birth" ||
            id === "phone_no" ||
            id === "emergency_contact_number" ||
            id === "address"
          }
        />
      </div>
    );
  };

  const renderFileInput = (id, label) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        key={id + fileInputKey}
        id={id}
        type="file"
        onChange={handleChange}
        className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-primary file:text-primary-foreground
                   hover:file:bg-primary/90"
      />
      {formData[id] && formData[id] instanceof File ? (
        <p className="text-xs text-muted-foreground mt-1 text-center font-medium text-green-600">
          Selected File: {formData[id].name}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          No file selected.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-8xl mx-auto ">
      <div className="gradient-header w-full flex items-center justify-between gap-6 p-6 shadow-lg shadow-glow animate-fade-in rounded-xl">
        {/* Left Section: Back Button and Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            className="text-primary hover:bg-white/90"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="space-y-1">
            <h1 className="text-primary-foreground font-extrabold text-2xl">
              Add Administration
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              Complete management and oversight
            </p>
          </div>
        </div>

        {/* Right Section: Sign Out Button */}
        <Button
          variant="secondary"
          className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4"></div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField(
              "name",
              "Full Name *",
              "text",
              "E.g., Michael Jordan"
            )}

            {renderInputField("date_of_birth", "Date of Birth *", "date")}

            {renderInputField(
              "age",
              "Age (Auto-Calculated)",
              "number",
              "e.g., 10",
              null,
              true
            )}

            {renderInputField(
              "phone_no",
              "Phone Number *",
              "tel",
              "10-digit mobile number",
              10
            )}

            {renderInputField(
              "email_id",
              "Email ID",
              "email",
              "E.g., player@example.com"
            )}

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                id="gender"
                value={formData.gender}
                onValueChange={(v) => handleSelectChange("gender", v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group *</Label>
              <Select
                id="blood_group"
                value={formData.blood_group}
                onValueChange={(v) => handleSelectChange("blood_group", v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Blood Group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                placeholder="Player's full address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Guardian, Emergency Contact & Medical</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField(
              "father_name",
              "Father's Name",
              "text",
              "E.g., John Smith"
            )}
            {renderInputField(
              "mother_name",
              "Mother's Name",
              "text",
              "E.g., Jane Smith"
            )}

            {renderInputField(
              "emergency_contact_number",
              "Emergency Contact No. *",
              "tel",
              "10-digit emergency number",
              10
            )}
            {renderInputField(
              "guardian_contact_number",
              "Guardian Contact No.",
              "tel",
              "Optional 10-digit number",
              10
            )}

            {renderInputField(
              "guardian_email_id",
              "Guardian Email ID",
              "email",
              "E.g., guardian@email.com"
            )}

            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="medical_condition">Medical Condition/Notes</Label>
              <Textarea
                id="medical_condition"
                placeholder="Any allergies, chronic conditions, or special notes..."
                value={formData.medical_condition}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="p-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Document Uploads</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderFileInput("profile_photo_path", "Player Profile Photo")}
              {renderFileInput("aadhar_upload_path", "Aadhar Card Upload")}
              {renderFileInput(
                "birth_certificate_path",
                "Birth Certificate Upload"
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel & Clear
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? "Saving Player..." : "Save Player"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPlayerForm;
