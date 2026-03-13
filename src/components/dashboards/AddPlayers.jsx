import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedInUserId } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Footer from "../../components/Footer";
import { Label } from "@/components/ui/label";
//import supabase from '../supabaseClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  ArrowLeft,
  XCircle,
  LogOut,
} from "lucide-react";

import { toast } from "sonner";
import { AddNewPlayerDetails } from "../../../api";

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
  pincode: "", 
  area: "", // Ensure lowercase matches backend expectations
  emergency_contact_number: "",
  guardian_contact_number: "",
  guardian_email_id: "",
  medical_condition: "",
  aadhar_upload_path: null, 
  aadhar_back_upload_path: null, 
  birth_certificate_path: null,
  profile_photo_path: null,
};

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
    toast.info("You have been signed out.");
    navigate("/auth");
  };

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target;
    if (["phone_no", "emergency_contact_number", "guardian_contact_number"].includes(id)) {
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
        newState.age = calculateAge(value);
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
    const tenantId = getLoggedInUserId();

    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
            dataToSend.append(key, formData[key]);
        }
      });
      dataToSend.append("tenant_id", tenantId);
      await AddNewPlayerDetails(dataToSend, token);      
      toast.success("Player added successfully!");
      navigate("/staff?tab=players");
    } catch (error) {
      console.error("Submission failed", error);
      toast.error(error.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleCancel = () => {
    resetForm();
    toast.info("Form cleared");
  };

  const renderInputField = (id, label, type = "text", placeholder = "", maxLength = null, disabled = false) => {
    const isDateOfBirth = id === "date_of_birth";
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={formData[id] || ""}
          onChange={isDateOfBirth ? (e) => handleSelectChange(id, e.target.value) : handleChange}
          maxLength={maxLength}
          disabled={disabled}
          required={["name", "date_of_birth", "phone_no", "emergency_contact_number", "address", "area", "pincode"].includes(id)}
        />
      </div>
    );
  };


  const renderFileInput = (id, label) => (
    <div className="flex flex-col items-center gap-3">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="w-full max-w-[230px] border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:border-[#1A9CFF] transition-all">
        <input
          key={fileInputKey}
          id={id}
          type="file"
          onChange={handleChange}
          className="block w-full file:mr-2 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1A9CFF] file:text-white hover:file:bg-[#1582d8] cursor-pointer text-center"
        />
      </div>
    </div>
  );

  const primaryColor = "#1A9CFF";

  return (
    <div className="space-y-6 pb-10">
      <div className="w-full flex items-center justify-between gap-6 p-6 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #0076D1 100%)` }}>
        <div className="flex items-center gap-4">
          <Button variant="secondary" className="bg-white text-[#1A9CFF]" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="space-y-1">
            <h1 className="text-white font-extrabold text-2xl">Add New player</h1>
            <p className="text-white/80 text-sm">Create a new player profile</p>
          </div>
        </div>
        <Button variant="secondary" className="bg-white/10 text-white" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-md border-t-4" style={{ borderTopColor: primaryColor }}>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField("name", "Full Name *")}
            {renderInputField("date_of_birth", "Date of Birth *", "date")}
            {renderInputField("age", "Age", "number", "", null, true)}
            {renderInputField("phone_no", "Phone Number *", "tel", "10-digit", 10)}
            {renderInputField("email_id", "Email ID", "email")}
            
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select onValueChange={(v) => handleSelectChange("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Blood Group *</Label>
              <Select onValueChange={(v) => handleSelectChange("blood_group", v)}>
                <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
           
            {renderInputField("area", "Area *", "text", "Area Name")}
            {renderInputField("pincode", "Pin-code *", "text", "6-digit", 6)}
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea id="address" value={formData.address} onChange={handleChange} required />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle>Guardian & Medical</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField("father_name", "Father's Name")}
            {renderInputField("mother_name", "Mother's Name")}
            {renderInputField("emergency_contact_number", "Emergency Contact *", "tel", "", 10)}
            {renderInputField("guardian_contact_number", "Guardian Contact", "tel", "", 10)}
            {renderInputField("guardian_email_id", "Guardian Email/User ID *", "email",)}
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="medical_condition">Medical Condition/Notes</Label>
              <Textarea
                id="medical_condition"
                value={formData.medical_condition}
                onChange={handleChange}
                placeholder="Any allergies or special notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-t-2" style={{ borderTopColor: primaryColor }}>
          <CardHeader><CardTitle style={{ color: primaryColor }}>Document Uploads</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderFileInput("profile_photo_path", "Profile Photo")}
            {renderFileInput("aadhar_upload_path", "Aadhar Front")}
            {renderFileInput("aadhar_back_upload_path", "Aadhar Back")}
            {renderFileInput("birth_certificate_path", "Birth Certificate")}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: primaryColor }} className="text-white">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Player
          </Button>
        </div>
      </form>
       <div className="flex flex-col overflow-hidden bg-gray-50">
        <Footer />
      </div>
    </div>
  );
};

export default AddPlayerForm;