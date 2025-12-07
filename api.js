// api.js
const API_URL = "https://academy-nexus-2-g46z.onrender.com";


import axios from "axios";

export const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch (e) {
    console.error("Error reading token:", e);
    return null;
  }
};

// ✅ Auth headers (fixed)
export const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const handleApiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
  
    let data;
    try {
      data = await response.json();
    } catch (e) {    
      data = null;
    }

    if (!response.ok) {      
      const errorMessage =
        data && data.error
          ? data.error
          : data && data.message
          ? data.message
          : `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Call Failed (${url}):`, error.message);
    throw error;
  }
};

export const signupUser = async ({ name, email, password, role }) => {
  try {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || "Signup failed." };
    }

    return { data, error: null };
  } catch (err) {
    console.error("API Error (Signup):", err);
    return {
      data: null,
      error: "Could not connect to the server. Make sure backend is running.",
    };
  }
};

export const loginUser = async ({ email, password, role }) => {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // CRITICAL: Must include role to pass the backend check
      body: JSON.stringify({ email, password, role }), 
    });

    const data = await response.json();

    if (!response.ok) {
      // Use the server's error message if available
      const errorMessage = data.message || data.error || "Login failed.";
      return { data: null, error: errorMessage };
    }
    
    return {
      data: {
        user: data.user,
        token: data.token, 
        role: data.user.role, 
      },
      error: null,
    };
  } catch (err) {
    console.error("API Error (Login):", err);
    return {
      data: null,
      error: "Could not connect to the server. Make sure backend is running.",
    };
  }
};

//show the all players details
export const GetPlayerDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/players-details`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching player details:", error);
    throw error;
  }
};

//add the new details of player to the database
export const AddNewPlayerDetails = async (formDataToSend) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/players-add`,
      formDataToSend, // This MUST be a FormData object
      {
        withCredentials: true,
        headers: {
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error adding new player:", error);
    throw error;
  }
};

//coach list show the assgin the coach and players
export const GetCoachDetailslist = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/coaches-list`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // <-- FIX: Corrected error message to 'coach details'
    console.error("Error fetching coach details:", error);
    throw error;
  }
};

//update the player details
export const GetPlayerEditDetails = async (id, player_id) => {
  // 1. Validate if IDs are provided before making the request
  if (!id || !player_id) {
    throw new Error(
      "Missing required parameters: id and player_id for fetching player details."
    );
  }

  try {
    // 2. Pass the IDs as query parameters using Axios 'params' property
    const response = await axios.get(`${API_URL}/api/Player-edit`, {
      params: {
        // Use 'params' to automatically construct the query string: ?id=...&player_id=...
        id: id,
        player_id: player_id,
      },
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching player details:", error);
    throw error;
  }
};

//update the player details
export const updateplayersedit = async (playerId, playerData) => {
  if (!playerId)
    throw new Error("Missing playerId when calling updateplayersedit.");

  const url = `${API_URL}/api/Player-Edit/${encodeURIComponent(playerId)}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(playerData),
    // credentials: 'include' // uncomment if you use cookies/auth
  });

  let payload;
  try {
    payload = await res.json();
  } catch (err) {
    // If server returned non-JSON, fallback to text
    const text = await res.text();
    throw new Error(`Server returned non-JSON response: ${text}`);
  }

  if (!res.ok) {
    // Try to return helpful message
    const errMsg =
      payload?.error ||
      payload?.message ||
      JSON.stringify(payload) ||
      `HTTP ${res.status}`;
    const error = new Error(errMsg);
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

//delete the player details
export const deletePlayer = async (playerId) => {
  if (!playerId) {
    throw new Error("Player ID is required for deletion.");
  }

  return handleApiCall(`${API_URL}/api/Player-Delete/${playerId}`, {
    method: "DELETE",
  });
};

//add the coach notes
export const AddCoachdata = async (apiData) => {
  try {
    const response = await fetch(`${API_URL}/api/coaches-add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! Status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      `API Call Failed (${API_URL}/api/coaches-add):`,
      error.message
    );
    throw error;
  }
};

//fetch the coach notes
export const GetCoachDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/coach-details`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // <-- FIX: Corrected error message to 'coach details' (already done in original)
    console.error("Error fetching coach details:", error);
    throw error;
  }
};

//coach update notes
export const UpdateCoachdata = async (apiData) => {
  const idValue = apiData.coach_id || apiData.id;

  const payload = {
    ...apiData,
    coach_id: idValue, // Ensure the server-expected field is populated
  };

  // Ensure this field deletion logic is correct based on your API's expected payload
  delete payload.name;
  const endpoint = `${API_URL}/api/coaches-update/coach_id`;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! Status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Call Failed (${endpoint}):`, error.message);
    throw error;
  }
};

//delete the coach notes
export const DeactivateCoachdata = async (coachId) => {
  const endpoint = `${API_URL}/api/coaches-deactivate/${coachId}`;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // FIX: Ensure this code handles non-JSON responses by checking content type,
      // but for a typical API failure, the server should send JSON.
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! Status: ${response.status}`
      );
    }

    // Return the full response data which includes the deactivated coach object
    const data = await response.json();
    return data;
  } catch (error) {
    // Renamed to DeactivateCoachdata
    console.error(`API Call Failed (${endpoint}):`, error.message);
    throw error;
  }
};

//agssign students to coaches
export const GetagssignDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/players-agssign`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    // Ensure the data structure matches what the component expects ({players: [...]})
    return response.data;
  } catch (error) {
    console.error("Error fetching player details:", error);
    // Throw a specific error for better error handling in the component
    throw new Error(`Failed to fetch player details: ${error.message}`);
  }
};

export async function AssignCoachupdated(coach_name, coach_id, player_id, id) {
  try {
    const response = await fetch(`${API_URL}/api/update-coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coach_name,
        coach_id,
        player_id,
        id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle HTTP errors (4xx or 5xx status codes)
      throw new Error(
        data.error || "Failed to assign coach due to a server error."
      );
    }

    return data;
  } catch (error) {
    console.error("Error assigning coach:", error);
    // Re-throw the error so the component can handle it
    throw error;
  }
}

// --- Venue Data Fetch (Read) ---
export async function fetchVenuesdetails() {
  try {
    const response = await fetch(`${API_URL}/api/venues-Details`);
    const data = await response.json();
    if (!response.ok) {
      // This is the line that captures the server's 500 error message
      throw new Error(
        data.error || "Failed to fetch venue data from the server."
      );
    }
    return data;
  } catch (error) {
    console.error("Error fetching venues:", error);
    throw error;
  }
}

//venue details add
export async function addVenueData(venueData) {
  try {
    const response = await fetch(`${API_URL}/api/venue-data/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(venueData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle server-side errors (e.g., failed transaction, validation errors)
      throw new Error(
        data.error || "Failed to add venue due to a network or server issue."
      );
    }

    return data;
  } catch (error) {
    console.error("Error adding new venue:", error);
    // Re-throw the error so the component can display a toast notification
    throw error;
  }
}

//delete venue details
export async function deleteVenue(venueId) {
  const url = `${API_URL}/api/venues-delete/${venueId}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage =
        data.error || `Server error (Status: ${response.status})`;
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error("Error deleting venue:", error.message);
    throw error;
  }
}

// ---------------------------------------------
// FETCH COACH ASSIGNED PLAYERS (USES AUTH HEADERS)
// ---------------------------------------------
export const fetchCoachAssignedPlayers = async (token) => {
  if (!token) {
    console.error(
      "Missing token for player fetch. This should be handled by the client."
    ); // If the client fails to check, we still return an empty array to prevent crashing
    throw new Error("Access Denied: No Token Provided");
  }

  try {
    // Calls the secure, parameter-less server route
    const response = await fetch(`${API_URL}/api/coach-data`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {}
      throw new Error(
        errorData.error || `Failed to fetch players: ${response.status}`
      );
    }

    const result = await response.json();

    if (!result || !Array.isArray(result.players)) {
      console.warn(
        "Players response is missing the 'players' array. Returning empty list.",
        result
      );
      return [];
    } // Normalize data using the aliases 'id' and 'attendance' from the SQL query

    return result.players.map((player) => ({
      id: player.id || player.player_id,
      name: player.name,
      age: player.age,
      position: player.category,
      status: player.status,
      attendance: parseFloat(player.attendance || 0),
    }));
  } catch (err) {
    console.error("Error fetching coach players:", err); // Re-throw the error so the client component's `catch` block can handle it
    throw err;
  }
};

/// ---------------------------------------------
//attandance update by coach
export const recordAttendance = async (attendanceData) => {
  const endpoint = `${API_URL}/api/attendance`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attendanceData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }
    return response.json();
  } catch (error) {
    console.error("API call failed for attendance recording:", error.message);
    throw error;
  }
};

// ---------------------------------------------
// Fetch the parent's players by guardian email
export const getPlayerDetailsByGuardianEmail = async (email, token) => {
  // 1. Input Validation
  if (!email || !token) {
    throw new Error("Missing authentication credentials (email or token).");
  }

  try { 
    const response = await fetch(`${API_URL}/api/player-details/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",       
        Authorization: `Bearer ${token}`,
      },
    });

  
    if (!response.ok) {
      let errorData = {}; 
      try {
        errorData = await response.json();
      } catch (e) { 
      }
      throw new Error(
        `API Error ${response.status}: ${
          errorData.error || errorData.message || "Failed to fetch players."
        }`
      );
    }

   
    const playersArray = await response.json(); 
    if (!Array.isArray(playersArray)) {
      console.warn(
        "API response is not an array. Returning empty list.",
        playersArray
      );
      return [];
    }
 
    return playersArray.map((childData) => ({
      player_id: childData.player_id,
      name: childData.name,
      age: childData.age,
      center: childData.center,
      coach: childData.coach,
      position: childData.position, // Mapped from category/position in DB
      phone_no: childData.phone_no,
      player_email: childData.player_email,
      // Ensure attendance_percentage is a number, defaulting to 0
      attendance_percentage: Number(childData.attendance_percentage) || 0,
      recent_activities_json: childData.recent_activities_json,
    }));
  } catch (err) {
    console.error("Error fetching player details:", err.message);
    throw err;
  }
};

//add the registrations
export const addregistrations = async (registr) => {
  try {
    const response = await axios.post(`${API_URL}/api/registrations/import`, registr, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding new contractor:", error);
    throw error;
  }
};

//feach the registrations 
export const GetregistrationsData = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/registrations`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    return response.data;   // <-- THIS RETURNS ONLY ONE LEVEL
  } catch (error) {
    console.error("Error fetching registration details:", error);
    throw error;
  }
};

// --- Corrected Function ---
export const importRegistrations = async (registrationsData) => {
  try {
    // The endpoint is /api/registrations/import, which suggests a bulk import.
    const response = await axios.post(
      `${API_URL}/api/registrations/import`, 
      registrationsData, // Passing the data for import
      {
        headers: getAuthHeaders(),
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    // Corrected error message to reflect the function's purpose (importing registrations)
    console.error("Error importing new registrations:", error);
    throw error;
  }
};

// If you need to approve/review a registration, you'll need another API function, e.g.:
export const updateRegistrationStatus = async (registrationId, newStatus) => {
    // Example implementation
    try {
        const response = await axios.patch(
            `${API_URL}/api/registrations/${registrationId}/status`,
            { status: newStatus },
            { headers: getAuthHeaders(), withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating registration ${registrationId}:`, error);
        throw error;
    }
};

// If you need an export function (handleExport)
export const exportRegistrations = async () => {
    // Example implementation
    try {
        const response = await axios.get(
            `${API_URL}/api/registrations/export`, 
            {
                headers: getAuthHeaders(), 
                withCredentials: true,
                responseType: 'blob' // Important for file downloads
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error exporting registrations:", error);
        throw error;
    }
};

///upload the excel sheet API 
export const uploadRegistrations = async (registrationsData) => {
    // Assuming API_URL is defined elsewhere
    const response = await fetch(`${API_URL}/api/registrations/bulk-upload`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationsData),
    });

    if (!response.ok) {
        // Attempt to read error message from response body if available
        const errorDetail = await response.text();
        // Throw an error with the status and a snippet of the error body for debugging
        throw new Error(`Bulk upload failed with status ${response.status}. Details: ${errorDetail.substring(0, 100)}...`);
    }

    return response.json();
};

//updated the status reject and approved the registration 
export const updateRegistrationData = async (regist_id, newStatus) => {
  try {
    const response = await axios.put(`${API_URL}/api/registrations/status/${regist_id}`, 
    { 
        status: newStatus 
    },
    {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Error updating status for ID ${regist_id}:`, error);
    throw error;
  }
};

//delete the registration
export const deleteRegistration = async (registId) => {
  try {
    const response = await fetch(`${API_URL}/api/registrations/${registId}`, {
      method: "DELETE", 
      headers: {
      },
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to delete registration.");
    }
    return { success: true, id: registId };
  } catch (error) {
    console.error(`Error deleting registration ${registId}:`, error);
    throw error; 
  }
};

// Assuming API_URL is defined
export const getCoachDetails = async (coachId) => {
  if (!coachId) return null;

  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const url = `${API_URL}/api/coachdata/${coachId}`;

    const response = await axios.get(url, {
      headers,
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`Coach ID ${coachId} not found (404).`);
      return null;
    }
    console.error("Error fetching coach details:", error.message);
    throw error;
  }
};

export const getCoachPlayers = async (coachId) => {
  if (!coachId) return [];
  try {
    const token = localStorage.getItem('token');
    // Ensure this URL is correct: /api/coachplayers/:coachId/players
    const response = await axios.get(`${API_URL}/api/coachplayers/${coachId}/players`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response) {
       console.error("Error fetching coach players data:", error.response.data);
    } else {
       console.error("Network / unknown error fetching coach players:", error.message);
    }
    return [];
  }
};

//fech the session data 
export const fetchSessionData = async (coachId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/api/sessions-data/${coachId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    const sessions = response.data;
    console.log("Fetched session data:", sessions);
    if (!Array.isArray(sessions)) {
      console.warn("Data is not an array:", sessions);
      return [];
    }
    return sessions;
  } catch (error) {
    console.error("Error fetching session data:", error);
    return [];
  }
};

// Function to insert a new training session via API
export const insertSession = async (sessionData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/sessions-insert`,
      sessionData,
      {
        
        headers: getAuthHeaders(), 
        withCredentials: true,
      }
    );
    
    return response.data;
    
  } catch (error) {
    console.error("Error inserting new session:", error); 
    throw error;
  }
}; 

//updated session API in coach washi edit the session
export const updateSession = async (session_id, sessionData) => {
  try {
    const response = await axios.put(`${API_URL}/api/sessions-updated/${session_id}`, sessionData, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating session with id ${session_id}:`, error);
    throw error;
  }
};

//delete the session coach and API
export const deleteSession = async (session_id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/sessions/${session_id}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.status; 
  } catch (error) {
    console.error(`Error deleting session with id ${session_id}:`, error);
    throw error;
  }
};
