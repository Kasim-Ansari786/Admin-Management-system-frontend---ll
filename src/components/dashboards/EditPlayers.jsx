import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GetPlayerEditDetails, updateplayersedit } from "../../../api";

const API_BASE_URL = "http://localhost:5000";

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
  aadhar_upload_path: "",
  birth_certificate_path: "",
  profile_photo_path: "",
  phone_no: "",
};

const showToast = (message, isSuccess) => {
  console.log(`${isSuccess ? "SUCCESS" : "ERROR"}: ${message}`);
};

const getFullImagePath = (relativePath) => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http") || relativePath.startsWith("https")) {
    return relativePath;
  }
  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const relative = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;

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
    navigate("/staff?tab=players");
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
    navigate("/staff?tab=players");
  };

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
        date_of_birth: data.date_of_birth?.split("T")[0] || "",
      });

      setPlayers([data]);

      showToast("Player details loaded successfully.", true);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to fetch player data.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
        active: !!formData.active,
      };

      await updateplayersedit(playerId, updateData);

      showToast("Player details updated successfully.", true);
      resetForm();
      goToStaffPage();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to update player details.";
      setError(errorMessage);
      showToast(errorMessage, false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-lg font-semibold">
        Loading player details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 border border-red-300 bg-red-50 rounded-lg">
        Error loading data: {error}
      </div>
    );
  }

  const PLACEHOLDER_IMAGE = "/placeholder-image.jpg";

  return (
    <div className="p-0 max-w-8xl mx-auto space-y-9">
      <div className="gradient-header w-full flex items-center gap-6 p-6 shadow-lg shadow-glow animate-fade-in rounded-xl">
        {/* Back Button Section */}
        <div className="flex-shrink-0">
          <Button
            variant="secondary"
            className="bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-md transition-all duration-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Text Content Section */}
        <div className="flex-grow">
          <h1 className="text-2xl font-bold header-text-shadow text-white leading-tight">
            Edit Players Administration
          </h1>
          <p className="text-white/80 text-sm mt-0.5">
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
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Age</Label>
              <Input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Input
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Blood Group</Label>
              <Input
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Phone No</Label>
              <Input
                name="phone_no"
                value={formData.phone_no}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Email ID</Label>
              <Input
                name="email_id"
                value={formData.email_id}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Address</Label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Emergency Contact No</Label>
              <Input
                name="emergency_contact_number"
                value={formData.emergency_contact_number}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Input
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Medical Condition</Label>
              <Input
                name="medical_condition"
                value={formData.medical_condition}
                onChange={handleInputChange}
              />
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
              <Input
                name="father_name"
                value={formData.father_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Mother's Name</Label>
              <Input
                name="mother_name"
                value={formData.mother_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Guardian Contact No</Label>
              <Input
                name="guardian_contact_number"
                value={formData.guardian_contact_number}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Guardian Email ID</Label>
              <Input
                name="guardian_email_id"
                value={formData.guardian_email_id}
                onChange={handleInputChange}
              />
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
                    src={
                      getFullImagePath(formData.aadhar_upload_path) ||
                      PLACEHOLDER_IMAGE
                    }
                    alt="Aadhar Document"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Birth Certificate
                </Label>
                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    // FIX: Use the helper function here
                    src={
                      getFullImagePath(formData.birth_certificate_path) ||
                      PLACEHOLDER_IMAGE
                    }
                    alt="Birth Certificate"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Profile Photo</Label>
                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    src={
                      getFullImagePath(formData.profile_photo_path) ||
                      PLACEHOLDER_IMAGE
                    }
                    alt="Profile Photo"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPlayer} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Player"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
