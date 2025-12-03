import { useState, useEffect, useCallback } from "react";
// 1. Import useNavigate for redirection
import { useNavigate } from "react-router-dom"; 
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
const initialFormData = {
  name: "", father_name: "", mother_name: "", gender: "", date_of_birth: "", age: "",
  blood_group: "", phone_no: "", email_id: "", address: "",
  emergency_contact_number: "", guardian_contact_number: "", guardian_email_id: "",
  medical_condition: "",
  aadhar_upload_path: null, birth_certificate_path: null, profile_photo_path: null,
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
     
    // Ensure the return value is a string, which is correct for form inputs
    return age >= 0 ? String(age) : "";
};


const AddPlayerForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());  
  const navigate = useNavigate();
  const handleSignOut = () => {
    console.log("User signed out!");
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
            // FIX: Ensure age is a string for the state
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

    if (formData.phone_no.length !== 10 || formData.emergency_contact_number.length !== 10) {
        toast.error("Phone Number and Emergency Contact No. must be exactly 10 digits.", { 
            duration: 5000, 
            style: { backgroundColor: '#FFEBEE', color: '#B71C1C', borderColor: '#F44336' } 
        });
        setIsSubmitting(false);
        return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
        const value = formData[key];
        
        if (value instanceof File) {
             // Append file with its original name
             formDataToSend.append(key, value, value.name); 
        } 
        // Append all other non-file fields that are not null/undefined
        // The server will handle conversion of 'age' to a number or null
        else if (value !== null && value !== undefined) {
             formDataToSend.append(key, String(value));
        }
    });
    
    try {
         // This call will now work if the server has 'pool' imported and 'cpUpload' configured
         const response = await AddNewPlayerDetails(formDataToSend);         
        toast.success(
            `Player added successfully! ${response.message || ''}`, 
            { 
                duration: 5000,
                style: { backgroundColor: '#E8F5E9', color: '#1B5E20', borderColor: '#4CAF50' }
            }
        );
        resetForm(); 
        setTimeout(() => {
             navigate('/staff'); 
        }, 100); 
        

    } catch (error) {
        console.error("Submission failed", error);        
        // Improved error message extraction
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to add player. Check console for details.";
        toast.error(
            errorMessage, 
            { 
                duration: 10000,
                style: { backgroundColor: '#FFEBEE', color: '#B71C1C', borderColor: '#F44336' }
            }
        );
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleCancel = () => {
    resetForm();
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
      <div
        className="bg-gradient-primary rounded-xl p-6 text-primary-foreground flex justify-between items-start"
        style={{ backgroundColor: "#2E7D32" }}
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold mb-2">Add Administration</h1>
          <p className="text-primary-foreground/80">
            Complete management and oversight
          </p>
        </div>
        <Button
          variant="secondary"
          className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

     
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">       
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">     
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField("name", "Full Name *", "text", "E.g., Michael Jordan")}
            
            {renderInputField("date_of_birth", "Date of Birth *", "date")} 
            
            {renderInputField("age", "Age (Auto-Calculated)", "number", "e.g., 10", null, true)} 

            {renderInputField("phone_no", "Phone Number *", "tel", "10-digit mobile number", 10)}
            
            {renderInputField("email_id", "Email ID", "email", "E.g., player@example.com")}

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                id="gender"
                value={formData.gender}
                onValueChange={(v) => handleSelectChange("gender", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group *</Label>
              <Select
                id="blood_group"
                value={formData.blood_group}
                onValueChange={(v) => handleSelectChange("blood_group", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((group) => (<SelectItem key={group} value={group}>{group}</SelectItem>))}
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
              />
            </div>
          </CardContent>
        </Card>
     
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Guardian, Emergency Contact & Medical</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField("father_name", "Father's Name", "text", "E.g., John Smith")}
            {renderInputField("mother_name", "Mother's Name", "text", "E.g., Jane Smith")}       
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInputField("emergency_contact_number", "Emergency Contact No. *", "tel", "10-digit emergency number", 10)}
              {renderInputField("guardian_contact_number", "Guardian Contact No.", "tel", "Optional 10-digit number", 10)}
              
              {renderInputField("guardian_email_id", "Guardian Email ID", "email", "E.g., guardian@email.com")}
            </div>           
            
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
            <CardHeader><CardTitle>Document Uploads</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderFileInput("profile_photo_path", "Player Profile Photo")}
              {renderFileInput("aadhar_upload_path", "Aadhar Card Upload")}
              {renderFileInput("birth_certificate_path", "Birth Certificate Upload")}
            </CardContent>
          </Card>
        </div>
       
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2" />Cancel & Clear</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (<Save className="h-4 w-4 mr-2" />)}
            {isSubmitting ? "Saving Player..." : "Save Player"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPlayerForm;