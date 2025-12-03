import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GetPlayerEditDetails, updateplayersedit } from "../../../api"; 

// Assume your API is running here. Replace this with your actual environment variable.
// In a typical React setup, this would be process.env.VITE_API_BASE_URL or similar.
const API_BASE_URL = "http://localhost:5000"; 


// Placeholder for a toast notification utility (replace with your actual toast implementation)
const toast = ({ title, description, variant }) => {
  console.log(`TOAST: ${title} - ${description} (Variant: ${variant})`);
};

const initialFormData = {
  name: "",
  age: "",
  address: "",
  center_name: "",
  coach_name: "",
  category: "",
  active: true,
  status: "Pending",
  father_name: "",
  mother_name: "",
  gender: "Male",
  date_of_birth: "",
  blood_group: "",
  email_id: "",
  emergency_contact_number: "",
  guardian_contact_number: "",
  guardian_email_id: "",
  medical_condition: "",
  // Paths are initially empty strings
  aadhar_upload_path: "", 
  birth_certificate_path: "",
  profile_photo_path: "",
  phone_no: "",
};

const showToast = (message, isSuccess) => {
  console.log(`${isSuccess ? "SUCCESS" : "ERROR"}: ${message}`);
};


// FIX: Helper function to construct the full image URL
const getFullImagePath = (relativePath) => {
    if (!relativePath) return ""; // Return empty string if no path is available
    // Check if the path is already a full URL (e.g., if it starts with 'http' or 'https')
    if (relativePath.startsWith('http') || relativePath.startsWith('https')) {
        return relativePath;
    }
    // Prepend the base URL for relative paths like /uploads/filename.jpg
    // We use a slight hack to handle trailing/leading slashes to prevent // in the path
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const relative = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    return baseUrl + relative;
};


export default function PlayerEditor() {
  const navigate = useNavigate(); 
  const { academyId, playerId } = useParams(); 

  const [players, setPlayers] = useState([]); 
  const [formData, setFormData] = useState(initialFormData);
  const [editingIndex, setEditingIndex] = useState(null); 
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null); 

  const goToStaffPage = () => {
    console.log("Navigating to Staff Page");
    navigate("/staff"); 
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    resetForm();
    navigate("/staff"); 
  };

  // Corrected function to accept and use IDs
  const fetchPlayerData = async (id, player_id) => {
    if (!id || !player_id) {
        setError("Player or Academy ID is missing. Cannot fetch data.");
        setIsLoading(false); 
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await GetPlayerEditDetails(id, player_id); 
      
      setFormData({
          ...initialFormData, 
          ...data,
          // Handle Date of Birth formatting if necessary. Assuming API returns 'YYYY-MM-DD'
          date_of_birth: data.date_of_birth?.split('T')[0] || ""
      }); 

      setPlayers([data]); 
      
      showToast("Player details loaded successfully.", true);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch player data.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData(academyId, playerId);
  }, [academyId, playerId]); 

  const handleSubmitPlayer = async (e) => {
    e.preventDefault(); 
    
    if (!academyId || !playerId) {
        showToast("Missing Academy or Player ID for update.", false);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
          academyId,
          playerId,
          ...formData,
          active: !!formData.active 
      };

      await updateplayersedit(playerId, updateData); 

      showToast("Player details updated successfully.", true);
      resetForm();
      goToStaffPage();
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update player details.";
      setError(errorMessage);
      showToast(errorMessage, false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-lg font-semibold">Loading player details...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 border border-red-300 bg-red-50 rounded-lg">
        Error loading data: {error}
      </div>
    );
  }
  
  // Define a placeholder image path for when no image is available
  const PLACEHOLDER_IMAGE = "/placeholder-image.jpg"; 
  // You might need to adjust this path or create a local placeholder image 
  // if you want a visual indication when the path is empty.

  return (
    <div className="p-0 max-w-8xl mx-auto space-y-9">
      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold mb-2">Staff Administration</h1>
          <p className="text-primary-foreground/80">
            Complete academy management and oversight
          </p>
        </div>
      </div>

      <Card className="p-4 shadow-xl rounded-2xl">
        <CardContent className="space-y-6">
          <h1 className="text-2xl font-bold text-center">Player Manager</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label>Full Name</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Age</Label>
              <Input type="number" name="age" value={formData.age} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Gender</Label>
              <Input name="gender" value={formData.gender} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Blood Group</Label>
              <Input name="blood_group" value={formData.blood_group} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Phone No</Label>
              <Input name="phone_no" value={formData.phone_no} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Email ID</Label>
              <Input name="email_id" value={formData.email_id} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Address</Label>
              <Input name="address" value={formData.address} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Emergency Contact No</Label>
              <Input name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Status</Label>
              <Input name="status" value={formData.status} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Medical Condition</Label>
              <Input name="medical_condition" value={formData.medical_condition} onChange={handleInputChange} />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                name="active"
                checked={!!formData.active} // Ensure it's treated as a boolean for the checkbox
                onChange={handleInputChange}
              />
              <Label>Active Player</Label>
            </div>

            <div>
              <Label>Father's Name</Label>
              <Input name="father_name" value={formData.father_name} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Mother's Name</Label>
              <Input name="mother_name" value={formData.mother_name} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Guardian Contact No</Label>
              <Input name="guardian_contact_number" value={formData.guardian_contact_number} onChange={handleInputChange} />
            </div>

            <div>
              <Label>Guardian Email ID</Label>
              <Input name="guardian_email_id" value={formData.guardian_email_id} onChange={handleInputChange} />
            </div>
          </div>

          <Card className="shadow-lg p-4">
            <CardHeader>
              <CardTitle>Document Images</CardTitle>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Aadhar Upload</Label>
                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    // FIX: Use the helper function here
                    src={getFullImagePath(formData.aadhar_upload_path) || PLACEHOLDER_IMAGE}
                    alt="Aadhar Document"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Birth Certificate</Label>
                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    // FIX: Use the helper function here
                    src={getFullImagePath(formData.birth_certificate_path) || PLACEHOLDER_IMAGE}
                    alt="Birth Certificate"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Profile Photo</Label>
                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    // FIX: Use the helper function here
                    src={getFullImagePath(formData.profile_photo_path) || PLACEHOLDER_IMAGE}
                    alt="Profile Photo"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSubmitPlayer} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Player"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}