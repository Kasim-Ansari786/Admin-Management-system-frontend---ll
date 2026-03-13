import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Footer from "../../components/Footer";
import { GetPlayerEditDetails, updateplayersedit } from "../../../api";

// Use local backend during development
const API_URL = "http://localhost:5001";

const toast = ({ title, description, variant }) => {
  console.log(`TOAST: ${title} - ${description} (Variant: ${variant})`);
};

const initialFormData = {
  name: "",
  age: "",
  address: "",
  area: "", // Added Area
  pincode: "", // Added Pin Code
  center_name: "",
  coach_name: "",
  category: "",
  active: true,
  // status: "Pending", // Removed Status
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
  aadhar_back_upload_path: "", // Added Aadhar Back
  birth_certificate_path: "",
  profile_photo_path: "",
  phone_no: "",
};

const showToast = (message, isSuccess) => {
  console.log(`${isSuccess ? "SUCCESS" : "ERROR"}: ${message}`);
};

const getFullImagePath = (value) => {
  try {
    if (!value) return "";
    if (value instanceof File || value instanceof Blob) {
      return URL.createObjectURL(value);
    }

    if (typeof value !== "string") return "";
    const trimmed = value.trim();

    // Absolute URLs or blob/data previews should be returned as-is
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
      return trimmed;
    }

    // If the path already contains the API base, return normalized form
    if (trimmed.startsWith(API_URL)) return trimmed;

    // If the value looks like a bare filename (no slash) with an image extension,
    // assume it's stored in the backend `/uploads` folder and build the full URL.
    if (!trimmed.includes("/") && !trimmed.includes("\\") && /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(trimmed)) {
      return `${API_URL.replace(/\/$/, "")}/uploads/${trimmed}`;
    }

    // If value contains any slashes (could be absolute fs path, backslashes, or a relative path),
    // extract the filename and map to /uploads/<filename> so the static server can serve it.
    if (trimmed.includes("/") || trimmed.includes("\\")) {
      const parts = trimmed.split(/[\\\/]+/);
      const filename = parts[parts.length - 1] || trimmed;
      if (/\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(filename)) {
        return `${API_URL.replace(/\/$/, "")}/uploads/${filename}`;
      }
    }

    // Normalize backslashes to forward slashes and remove leading ./
    let normalized = trimmed.replace(/\\\\/g, "/").replace(/\\/g, "/").replace(/^\.\//, "");
    if (!normalized.startsWith("/")) normalized = "/" + normalized;

    return API_URL.replace(/\/$/, "") + normalized;

  } catch (e) {
    return "";
  }
};

const getFileDisplayName = (fieldName, data) => {
  // Prefer explicit file object stored as `${field}_file`
  const fileObj = data?.[`${fieldName}_file`];
  if (fileObj && fileObj.name) return fileObj.name;

  const val = data?.[fieldName];
  if (!val) return "No file chosen";

  // If val is a URL/path, extract filename
  if (typeof val === "string") {
    try {
      const u = new URL(val, API_URL);
      const parts = u.pathname.split("/");
      return parts[parts.length - 1] || "uploaded-file";
    } catch (e) {
      // Fallback: last segment
      const parts = val.split("/");
      return parts[parts.length - 1] || "uploaded-file";
    }
  }

  return "No file chosen";
};

export default function PlayerEditor() {
  const navigate = useNavigate();
  const { academyId, playerId } = useParams();

  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  const goToStaffPage = () => {
    navigate("/staff?tab=players");
    window.location.reload();
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
  };

  const handleCancel = () => {
    resetForm();
    navigate("/staff?tab=players");
    window.location.reload();
  };

  const fetchPlayerData = async (id, player_id) => {
    if (!id || !player_id) {
      setError("Player or Academy ID is missing. Cannot fetch data.");
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
    if (!playerId) {
      showToast("Missing Player ID for update.", false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        active: !!formData.active,
      };

      await updateplayersedit(playerId, updateData);

      showToast("Player details updated successfully.", true);
      resetForm();
      goToStaffPage();
    } catch (err) {
      console.error("Submit Error:", err);
      const errorMessage = err.message.includes("Failed to fetch")
        ? "Network Error: Cannot connect to the server. Check your API_URL."
        : err.message || "Failed to update player details.";

      setError(errorMessage);
      showToast(errorMessage, false);
    } finally {
      setIsLoading(false);
    }
  };

  // Compress large images to avoid 413 Payload Too Large errors
  const compressImageFile = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            });
            URL.revokeObjectURL(url);
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  const handleImageChange = async (e, field) => {
    const file = e.target.files[0];

    if (!file) return;

    // Client-side size limit: 3.5MB. If larger, attempt compression; if still too large, reject.
    const MAX_BYTES = 3.5 * 1024 * 1024;
    let fileToUpload = file;

    if (file.size > MAX_BYTES) {
      try {
        const compressed = await compressImageFile(file, 1200, 0.8);
        if (compressed.size < file.size) {
          fileToUpload = compressed;
        }
      } catch (err) {
        console.warn("Image compression failed, using original file:", err);
      }
    }

    if (fileToUpload.size > MAX_BYTES) {
      showToast("Selected image is too large. Please choose an image under 3.5MB.", false);
      return;
    }

    const preview = URL.createObjectURL(fileToUpload);

    setFormData((prev) => ({
      ...prev,
      [field]: preview,
      [`${field}_file`]: fileToUpload,
    }));
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

  const PLACEHOLDER_IMAGE = `${API_URL.replace(/\/$/, "")}/uploads/placeholder.png`;

  return (
    <div className="p-0 max-w-8xl mx-auto space-y-9 pb-10">
      <div className="gradient-header w-full flex items-center gap-6 p-6 shadow-lg shadow-[#1A9CFF]/30 animate-fade-in rounded-xl bg-[#1A9CFF] bg-gradient-to-r from-[#1A9CFF] to-[#0076D1]">
        <div className="flex-shrink-0">
          <Button
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md transition-all duration-300"
            onClick={() => {
              navigate(-1);
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex-grow">
          <h1 className="text-2xl font-bold header-text-shadow text-white leading-tight">
            Edit Student Administration
          </h1>
          <p className="text-white/90 text-sm mt-0.5">
            Complete academy management and oversight
          </p>
        </div>
      </div>

      <Card className="p-4 shadow-xl rounded-2xl">
        <CardContent className="space-y-6">
          <h1 className="text-2xl font-bold text-center">
            Edit Student Manager
          </h1>

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
              <Label>Area</Label>
              <Input
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                placeholder="Enter Area"
              />
            </div>

            <div>
              <Label>Pin Code</Label>
              <Input
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Enter Pin Code"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
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
                checked={!!formData.active}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Aadhar Front */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Aadhar Front</Label>

                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    src={getFullImagePath(formData?.['aadhar_upload_path_file'] || formData?.aadhar_upload_path) || PLACEHOLDER_IMAGE}
                    alt="Aadhar Front"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="aadharFront"
                  onChange={(e) => handleImageChange(e, "aadhar_upload_path")}
                />

                <Label
                  htmlFor="aadharFront"
                  className="cursor-pointer inline-block text-center w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Upload / Change
                </Label>
                <div className="mt-2 text-xs text-slate-500">
                  {getFileDisplayName("aadhar_upload_path", formData)}
                </div>
              </div>

              {/* Aadhar Back */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Aadhar Back</Label>

                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    src={getFullImagePath(formData?.['aadhar_back_upload_path_file'] || formData?.aadhar_back_upload_path) || PLACEHOLDER_IMAGE}
                    alt="Aadhar Back"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="aadharBack"
                  onChange={(e) =>
                    handleImageChange(e, "aadhar_back_upload_path")
                  }
                />

                <Label
                  htmlFor="aadharBack"
                  className="cursor-pointer inline-block text-center w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Upload / Change
                </Label>
                <div className="mt-2 text-xs text-slate-500">
                  {getFileDisplayName("aadhar_back_upload_path", formData)}
                </div>
              </div>

              {/* Birth Certificate */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Birth Certificate
                </Label>

                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    src={getFullImagePath(formData?.['birth_certificate_path_file'] || formData?.birth_certificate_path) || PLACEHOLDER_IMAGE}
                    alt="Birth Certificate"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="birthCertificate"
                  onChange={(e) =>
                    handleImageChange(e, "birth_certificate_path")
                  }
                />

                <Label
                  htmlFor="birthCertificate"
                  className="cursor-pointer inline-block text-center w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Upload / Change
                </Label>
                <div className="mt-2 text-xs text-slate-500">
                  {getFileDisplayName("birth_certificate_path", formData)}
                </div>
              </div>

              {/* Profile Photo */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Profile Photo</Label>

                <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                  <img
                    src={getFullImagePath(formData?.['profile_photo_path_file'] || formData?.profile_photo_path) || PLACEHOLDER_IMAGE}
                    alt="Profile Photo"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="profilePhoto"
                  onChange={(e) => handleImageChange(e, "profile_photo_path")}
                />

                <Label
                  htmlFor="profilePhoto"
                  className="cursor-pointer inline-block text-center w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Upload / Change
                </Label>
                <div className="mt-2 text-xs text-slate-500">
                  {getFileDisplayName("profile_photo_path", formData)}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmitPlayer}
              disabled={isLoading}
              className="bg-[#1A9CFF] hover:bg-[#0085FF] text-white shadow-md shadow-[#1A9CFF]/30 transition-all duration-200 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Updating...
                </span>
              ) : (
                "Update Player"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col overflow-hidden bg-gray-50">
        <Footer />
      </div>
    </div>
  );
}
