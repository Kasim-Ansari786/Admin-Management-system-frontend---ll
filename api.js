import axios from "axios";

// --- Configuration ---
// Use local backend during development to avoid CORS and reach the dev server
const API_URL = "https://coneadminbackend.comdata.in";
//export const API_URL = "http://localhost:5001";
// Production backend: https://coneadminbackend.comdata.in
const TOKEN_KEY = "token";
const REFRESH_KEY = "refreshToken"; 

// --- Storage Utilities ---

const readTokenFromStorage = () => {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem("authToken") ||
    null
  );
};

const readRefreshFromStorage = () => {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY) || null;
};

const saveTokensToStorage = ({ token, refreshToken, persist = true }) => {
  const storage = persist ? localStorage : sessionStorage;
  const otherStorage = persist ? sessionStorage : localStorage;
  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(REFRESH_KEY);

  if (token) storage.setItem(TOKEN_KEY, token);
  if (refreshToken) storage.setItem(REFRESH_KEY, refreshToken);
};

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
};


const readTenantIdFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (!raw) {
      console.warn('readTenantIdFromStorage: No user found in storage (authUser or user key)');
      return null;
    }
    const user = JSON.parse(raw);
    const tenantId = user?._id || user?.id || user?.user_id || user?.userId || user?.idValue || null;
    if (tenantId) {
      console.debug(`readTenantIdFromStorage: Found tenant ID: ${String(tenantId).substring(0, 10)}...`);
    } else {
      console.warn('readTenantIdFromStorage: User object found but no recognized ID field', Object.keys(user || {}));
    }
    return tenantId;
  } catch (e) {
    console.warn('readTenantIdFromStorage: failed to parse stored user', e);
    return null;
  }
};

export const getToken = readTokenFromStorage;


const tryRefreshToken = async () => {
  const refreshToken = readRefreshFromStorage();
  if (!refreshToken) return false;

  try {
    const resp = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken }, {
      headers: { "Content-Type": "application/json" },
    });
    const newToken = resp?.data?.token ?? resp?.data?.accessToken;
    const newRefresh = resp?.data?.refreshToken ?? null;

    if (!newToken) return false;
    saveTokensToStorage({ token: newToken, refreshToken: newRefresh, persist: true }); 
    console.info("Token refreshed successfully.");
    return true;
  } catch (err) {
    console.warn("Refresh token failed:", err?.response?.data ?? err.message ?? err);
    clearAuthStorage();
    return false;
  }
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    let token = readTokenFromStorage();
    if (!token && !config.url?.includes("/api/auth/refresh")) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        token = readTokenFromStorage();
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      try {
        const short = token.length > 10 ? `${token.slice(0,6)}...${token.slice(-4)}` : token;
        console.debug(`[api] Attaching token to request ${config.method?.toUpperCase()} ${config.url}: ${short}`);
      } catch (e) {}
    } else {
      console.debug(`[api] No token available for request ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (originalRequest.url && originalRequest.url.includes("/api/auth/refresh")) {
        clearAuthStorage();
        return Promise.reject({
          ...error,
          message: "Session expired or unauthorized. Please log in again.",
        });
      }

      try {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          const token = readTokenFromStorage();
          if (token) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
      } catch (e) {
        console.warn("Automatic refresh failed:", e);
      }

      clearAuthStorage();
      return Promise.reject({
        ...error,
        message: "Session expired or unauthorized. Please log in again.",
      });
    }

    if (status === 403) {
      clearAuthStorage();
      return Promise.reject({
        ...error,
        message: "Forbidden. Please check your permissions.",
      });
    }

    return Promise.reject(error);
  }
);

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

// --- 1. Signup Function ---
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
    // Ensure data sent to server is clean
    const payload = {
      email: email.trim().toLowerCase(),
      password: password, // Password should NOT be lowercased
      role: role.toLowerCase(),
    };

    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || "Login failed.";
      return { data: null, error: errorMessage };
    }

    const accessToken = data.token ?? data.accessToken ?? null;
    const refreshToken = data.refreshToken ?? null;

    if (accessToken) {
      saveTokensToStorage({ token: accessToken, refreshToken, persist: true });
    }

    if (data.user) {
      saveAuth({ token: accessToken, user: data.user });
    }

    return {
      data: {
        user: data.user,
        token: accessToken,
        refreshToken,
        role: data.user?.role,
        logo: data.user?.logo || null,
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

export const saveAuth = ({ token, user, refreshToken, persist = true }) => {
  if (token || refreshToken) {
    saveTokensToStorage({ token, refreshToken, persist });
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};
export const getAuthHeaders = () => {
  const token = readTokenFromStorage();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
export const GetPlayerDetails = async () => {
  try {
    const response = await api.get("/api/players");
    return response.data?.players ?? response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          const retryResp = await api.get("/api/players");
          return retryResp.data?.players ?? retryResp.data;
        }
      } catch (e) {
        console.warn("Retry after refresh failed:", e);
      }
      const token = readTokenFromStorage();
      if (token) {
        try {
          console.debug('[api] Fallback axios.get with explicit Authorization header');
          const fallback = await axios.get(`${API_URL}/api/players`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          });
          return fallback.data?.players ?? fallback.data;
        } catch (fbErr) {
          console.warn('Fallback request also failed:', fbErr?.response ?? fbErr.message ?? fbErr);
        }
      } else {
        console.debug('[api] Fallback skipped — no token in storage');
      }
    }

    console.error("GetPlayerDetails error:", error);
    throw error;
  }
};

export const AddNewPlayerDetails = async (formData) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data', 
        },
    };
    const response = await api.post('/api/players-add', formData, config);
    return response.data;
};

//coach list show the assgin the coach and players
export const GetCoachDetailslist = async () => {
  try {
    // Use shared axios instance so interceptors attach tokens and handle refresh
    const resp = await api.get("/api/coaches-list", { withCredentials: true });
    // Normalize: backend may return { data: [...] } or full array
    const body = resp?.data ?? resp;
    if (Array.isArray(body)) return body;
    // prefer body.data when present
    return body?.data ?? body;
  } catch (error) {
    const errorDetail = error?.response?.data ?? error?.message ?? error;
    console.error("Error fetching coach details:", errorDetail);
    // Return empty array instead of throwing to avoid breaking UIs
    return [];
  }
};

//update the player details
export const GetPlayerEditDetails = async (id, player_id) => {
  if (!id || !player_id) {
    throw new Error(
      "Missing required parameters: id and player_id for fetching player details."
    );
  }

  try {
    const response = await axios.get(`${API_URL}/api/Player-edit`, {
      params: {
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
  if (!playerId) throw new Error("Missing playerId.");
  const url = `${API_URL}/api/Player-Edit/${encodeURIComponent(playerId)}`;
  try {
    let res;
    const hasFile = Object.keys(playerData || {}).some((k) =>
      k.endsWith("_file") || playerData[k] instanceof File ||
      (playerData[k] && playerData[k].constructor && playerData[k].constructor.name === 'File')
    );

    if (hasFile) {
      const form = new FormData();
      for (const key of Object.keys(playerData || {})) {
        const val = playerData[key];
        if (key.endsWith("_file") && val) {
          const fieldName = key.replace(/_file$/, "");
          form.append(fieldName, val);
          continue;
        }
        const fileKey = `${key}_file`;
        if (playerData[fileKey]) continue;

        if (val !== undefined && val !== null) {
          form.append(key, val);
        } else {
          form.append(key, "");
        }
      }

      const token = readTokenFromStorage();
      const fetchHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      res = await fetch(url, {
        method: "PUT",
        body: form,
        headers: fetchHeaders,
        credentials: 'include',
      });
    } else {
      const token = readTokenFromStorage();
      const fetchHeaders = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      res = await fetch(url, {
        method: "PUT",
        headers: fetchHeaders,
        credentials: 'include',
        body: JSON.stringify(playerData),
      });
    }
    let payload = null;
    try {
      payload = await res.json();
    } catch (e) {
      payload = null;
    }

    if (!res.ok) {
      if (res.status === 413) {
        const message = (payload && (payload.error || payload.message)) || 'Upload error: file too large (413)';
        const error = new Error(message);
        error.status = 413;
        throw error;
      }
      const error = new Error((payload && (payload.error || payload.message)) || `Update failed (status ${res.status})`);
      error.status = res.status;
      throw error;
    }

    return payload;
  } catch (err) {
    console.error("Fetch Error:", err);
    throw err;
  }
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

export const AddCoachdata = async (apiData) => {
  const headers = getAuthHeaders();
  
  // Ensure we are sending FormData for multipart/form-data
  let body = apiData;
  if (!(apiData instanceof FormData)) {
    body = new FormData();
    for (const key in apiData) {
      // Handle nested objects/arrays
      if (typeof apiData[key] === 'object' && !(apiData[key] instanceof File)) {
        body.append(key, JSON.stringify(apiData[key]));
      } else {
        body.append(key, apiData[key]);
      }
    }
  }

  try {
    const response = await api.post('/api/coaches', body, {
      headers: {
        ...headers,
        // Let the browser set the boundary for multipart/form-data automatically
        'Content-Type': undefined, 
      },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to add coach');
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
    console.error("Error fetching coach details:", error);
    throw error;
  }
};

//coach update notes
export const UpdateCoachdata = async (formData) => {
  // Use formData.get() to retrieve the ID from the FormData object
  const idValue = formData.get("coach_id");
  
  if (!idValue) {
    throw new Error("Missing coach_id when calling UpdateCoachdata.");
  }

  const endpoint = `${API_URL}/api/coaches-update/${encodeURIComponent(idValue)}`;

  try {
    const response = await axios.put(endpoint, formData, {
      headers: {
        ...getAuthHeaders(),
        // Axios will automatically set the correct Boundary for multipart/form-data
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const serverData = error?.response?.data ?? null;
    const serverMsg = serverData?.error || error.message;
    throw new Error(serverMsg || "Failed to update coach data.");
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

    return response.data;
  } catch (error) {
    const errorDetail = error.response ? error.response.data : error.message;
    console.error("Error fetching AGSSign player details:", errorDetail);
    throw new Error(`Failed to fetch player details: ${errorDetail}`);
  }
};

export async function AssignCoachupdated(coach_name, coach_id, player_id, id) {
  try {
    const resp = await api.post(
      "/api/update-coach",
      { 
        coach_name, 
        coach_id, 
        player_id, 
        id 
      },
      { headers: { "Content-Type": "application/json" } }
    );

    return resp.data;
  } catch (error) {
    const errorMsg = error?.response?.data?.details || error?.response?.data?.error || "Failed to assign coach";
    console.error("AssignCoachupdated error:", errorMsg);
    
    const err = new Error(errorMsg);
    err.status = error?.response?.status;
    throw err;
  }
}
// --- Venue Data Fetch (Read) ---
export async function fetchVenuesdetails() {
  try {
    // Use raw token string when building Authorization header
    const token = getToken();

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const response = await fetch(`${API_URL}/api/venues-Details`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    const contentType = response.headers.get("content-type");
    const data = contentType && contentType.includes("application/json") 
        ? await response.json() 
        : { error: "Server returned non-JSON response." };

    if (!response.ok) {
  if (response.status === 401 || response.status === 403) {
    console.warn("Token invalid or expired. Redirecting to login...");
    localStorage.removeItem('token'); 
    window.location.href = "/auth"; 
    
    throw new Error("Session expired. Please log in again.");
  }
  throw new Error(data.error || "Failed to fetch venue data.");
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
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }
    const response = await fetch(`${API_URL}/api/venue-add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(venueData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token invalid or expired. User needs to re-authenticate.");
      }
      throw new Error(
        data.error || `Failed to add venue. Server responded with status ${response.status}.`
      );
    }

    return data;
  } catch (error) {
    console.error("Error adding new venue:", error);
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
    ); 
    throw new Error("Access Denied: No Token Provided");
  }

  try {
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
    } 

    return result.players.map((player) => ({
      id: player.id || player.player_id,
      name: player.name,
      age: player.age,
      position: player.category,
      status: player.status,
      attendance: parseFloat(player.attendance || 0),
    }));
  } catch (err) {
    console.error("Error fetching coach players:", err);
    throw err;
  }
};


//attandance update by coach
export const recordAttendance = async (attendanceData, token) => {
  const endpoint = `${API_URL}/api/attendance`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, 
      },
      body: JSON.stringify(attendanceData),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Error ${response.status}: Failed to save record.`);
    }
    
    return result;
  } catch (error) {
    console.error("API call failed:", error.message);
    throw error;
  }
};


// Fetch the parent's players by guardian email
export const getPlayerDetailsByGuardianEmail = async (email, maybePlayerIdOrToken, maybeToken) => {
  let playerId = null;
  let token = null;

  if (maybeToken !== undefined) {
    playerId = maybePlayerIdOrToken;
    token = maybeToken;
  } else {
    token = maybePlayerIdOrToken;
  }

  if (!email || !token) {
    throw new Error("Missing credentials.");
  }

  const url = playerId 
    ? `${API_URL}/api/player-details/${encodeURIComponent(email.trim())}/${playerId}`
    : `${API_URL}/api/player-details-by-guardian/${encodeURIComponent(email.trim())}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  const data = await response.json();
  
  // Helper to format data consistently
  const format = (item) => ({
    ...item,
    attendance_percentage: parseFloat(item.attendance_percentage) || 0,
    recent_activities: item.recent_activities_json || [],
  });

  return Array.isArray(data) ? data.map(format) : [format(data)];
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
  const token = readTokenFromStorage();
  if (!token) {
    console.error("GetregistrationsData: No auth token found in storage. Cannot fetch registrations.");
    throw new Error("Authentication required.");
  }
  try {
    const short = token.length > 10 ? `${token.slice(0,6)}...${token.slice(-4)}` : token;
    console.debug(`[GetregistrationsData] token present: ${short}`);
  } catch (e) {}

  try {
    const response = await api.get("/api/registrations");
    return response.data;
  } catch (error) {
    console.error("Error fetching registration details:", error);
    throw error;
  }
};

// --- Corrected Function ---
export const importRegistrations = async (registrationsData) => {
  try {    
    const response = await axios.post(
      `${API_URL}/api/registrations/import`, 
      registrationsData, 
      {
        headers: getAuthHeaders(),
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error importing new registrations:", error);
    throw error;
  }
};

// If you need to approve/review a registration, you'll need another API function, e.g.:
export const updateRegistrationStatus = async (registrationId, newStatus) => {
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
    try {
        const response = await axios.get(
            `${API_URL}/api/registrations/export`, 
            {
                headers: getAuthHeaders(), 
                withCredentials: true,
                responseType: 'blob' 
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error exporting registrations:", error);
        throw error;
    }
};

/// Upload the excel sheet API (bulk registrations)
export const uploadRegistrations = async (registrationsData) => {
  try {
    const headers = getAuthHeaders();

    if (!headers.Authorization) {
      throw new Error("User not authenticated. Cannot perform bulk upload.");
    }

    const response = await axios.post(
      `${API_URL}/api/registrations/bulk-upload`,
      registrationsData,
      {
        headers,
        withCredentials: true,
      }
    );

    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message || String(err);
    console.error("uploadRegistrations failed:", status, detail);
    throw new Error(
      err.response?.data?.error || `Bulk upload failed${status ? ` (status ${status})` : ''}: ${detail}`
    );
  }
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
    const response = await axios.get(`${API_URL}/api/coachplayers/${coachId}/players`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    const status = error.response?.status;
    const respData = error.response?.data;
    if (error.response) {
      console.error("Error fetching coach players data:", respData || status || error.message);
    } else {
      console.error("Network error fetching coach players:", error.message);
      return [];
    }
    try {
      const idStr = String(coachId);
      const numeric = idStr.replace(/[^0-9]/g, "");
      if (numeric && numeric !== idStr) {
        const token2 = localStorage.getItem('token');
        const resp2 = await axios.get(`${API_URL}/api/coachplayers/${numeric}/players`, {
          headers: {
            Authorization: token2 ? `Bearer ${token2}` : '',
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        return Array.isArray(resp2.data) ? resp2.data : [];
      }
    } catch (retryErr) {
      console.error("Retry (numeric id) failed:", retryErr?.response?.data || retryErr.message || retryErr);
    }

    return [];
  }
};

//fech the session data 
export const fetchSessionData = async (coachId, token) => {
  try {
    if (!coachId) {
      console.warn("fetchSessionData: Missing coachId");
      return [];
    }
    if (!token) {
      token = readTokenFromStorage();
      if (!token) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          token = readTokenFromStorage();
        }
      }
    }

    if (!token) {
      console.error("fetchSessionData: Authentication token is missing.");
      return [];
    }

    const response = await axios.get(`${API_URL}/api/sessions-data/${encodeURIComponent(coachId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
    if (axios.isAxiosError && axios.isAxiosError(error)) {
      console.error("Axios Status:", error.response?.status);
      console.error("Axios Data:", error.response?.data);
    }
    return [];
  }
};

// Function to insert a new training session via API
export const insertSessionData = async (sessionData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await axios.post(`${API_URL}/api/sessions-insert`, sessionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error inserting session:", error.response?.data || error.message);
    throw error.response?.data || error;
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

//fetch the payment details
export const getPayments = async () => {
  try {
    const response = await api.get('/api/payments');
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("❌ Error fetching payment details:", error?.response ?? error.message ?? error);
    
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      throw new Error('Unauthorized. Please log in again.');
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch payment records.'
    );
  }
};

//Add the payment records 
export const addpayment = async (payment) => {
    try {
        const response = await axios.post(`${API_URL}/api/payment`, payment, {
            headers: getAuthHeaders(),
            withCredentials: true,
        });
        
        // Correctly extract the data object returned by the server
        return response.data.data; 

    } catch (error) {
        console.error("Error adding payment details:", error); 
        // Throw a clearer error for the frontend
        throw new Error(error.response?.data?.message || error.message);
    }
};

export const getPaymentsdetails = async () => {
  try {
    const response = await api.get('/api/payments');
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Error fetching payment details:", error?.response ?? error.message ?? error);
    const status = error?.response?.status;
    // If auth/permission failure, try a fallback explicit request using stored token
    if (status === 401 || status === 403) {
      const token = readTokenFromStorage();
      if (token) {
        try {
          console.debug('[api] getPaymentsdetails fallback using explicit Authorization header');
          const fallback = await axios.get(`${API_URL}/api/payments`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          });
          return fallback.data?.data ?? fallback.data ?? [];
        } catch (fbErr) {
          console.warn('Fallback request also failed:', fbErr?.response ?? fbErr.message ?? fbErr);
        }
      }
      throw new Error(status === 401 ? 'Unauthorized. Please log in again.' : 'Forbidden. Please check your permissions.');
    }

    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payment records.');
  }
};

// download the payment receiptexport const downloadPaymentReceipt = async (paymentId) => {
export const getPaymentsExceldata = async () => {
  try {
    const response = await api.get('/api/payments');
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Error fetching payment details for export:", error?.response ?? error.message ?? error);
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      throw new Error('Unauthorized. Please log in again.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payment records.');
  }
};

//delete the payment details
export const deletePayment = async (paymentId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/payment/deactivate/${paymentId}`,
      {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      }
    );

    if (response.ok || response.status === 204) {
      return { success: true, id: paymentId };
    }

    const contentType = response.headers.get("content-type") || "";
    let parsed;
    if (contentType.includes("application/json")) {
      try {
        parsed = await response.json();
      } catch (e) {
        parsed = { message: `Server error: ${response.status}` };
      }
    } else {
      parsed = await response.text();
    }

    throw new Error(parsed.message || parsed || `Request failed with status ${response.status}`);
  } catch (error) {
    console.error(`❌ Error deleting payment ${paymentId}:`, error);
    throw error; 
  }
};


//update the payment details
export const updatePayment = async (paymentId, paymentData) => {
    try {
        const response = await fetch(
            `${API_URL}/api/payment/${paymentId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(paymentData),
            }
        );
        if (!response.ok) {
            let errorMessage = `Failed to update payment record ${paymentId}.`;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.error || errorBody.message || errorMessage;
            } catch (parseError) {
                errorMessage = `HTTP Error: ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ API Error - updatePayment (${paymentId}):`, error.message);
        throw error;
    }
};

// Clear auth tokens and user data from storage
export async function getPaymentDetailsupdated(paymentId) {
    if (!paymentId) {
        throw new Error("A payment ID must be provided.");
    }
    const url = `${API_URL}/api/payment/${paymentId}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! Status: ${response.status}`);
        }
        return data;

    } catch (error) {
        console.error(`❌ Error fetching payment details for ID ${paymentId}:`, error);
        throw error;
    }
}

//fech the player details pending and paid payments
export const getPaymentStatus = async () => {
  try {
    const response = await api.get('/api/payments');
    const rows = response.data?.data ?? response.data ?? [];

    const totalCount = Array.isArray(rows) ? rows.length : 0;
    const totalAmount = Array.isArray(rows)
      ? rows.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0)
      : 0;
    const byStatus = Array.isArray(rows)
      ? rows.reduce((acc, r) => {
          const st = (r.status || 'unknown').toString();
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {})
      : {};

    return {
      totalCount,
      totalAmount,
      byStatus,
      rows,
    };
  } catch (error) {
    console.error("Error fetching payment details:", error?.response || error?.message || error);
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      throw new Error('Unauthorized. Please log in again.');
    }
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch payment records.';
    throw new Error(errorMessage);
  }
};

//fetch the coach loction data and details
export const getVenuesLocation = async () => {
  try {
    const response = await fetch(`${API_URL}/api/venues-drop`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error: ${response.status} Failed to fetch venues`);
    }

    // Normalize the backend rows to an array of { id, name }
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => ({
      id: r.id ?? r.venue_id ?? r.venueId ?? null,
      name: r.name ?? r.center_head ?? r.centerHead ?? r.center ?? String(r.id ?? "").toString(),
      raw: r,
    }));
  } catch (error) {
    console.error('API Error (getVenuesLocation):', error);
    throw error;
  }
};

//fetch the code attendance coach details
export const GetAttendanceRecords = async (coachId) => {
  if (!coachId) throw new Error("GetAttendanceRecords: coachId is required");
  try {
    const response = await axios.get(`${API_URL}/api/attendance-records/${encodeURIComponent(coachId)}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const errorDetail = error.response
      ? error.response.data?.message || error.response.data || error.response.statusText
      : error.message;

    if (status === 404 || String(errorDetail).toLowerCase().includes("no data")) {
      return [];
    }

    console.error("Error fetching attendance records:", errorDetail);
    throw new Error(`Failed to fetch attendance records: ${errorDetail}`);
  }
};

//add the schedule player details
export const addScheduleEvent = async (eventData) => {
    try {
        const response = await axios.post(`${API_URL}/api/schedule-addevents`, eventData, {
            headers: getAuthHeaders(),
            withCredentials: true,
        });
        return response.data.data; 

    } catch (error) {
        console.error("Error adding schedule event:", error); 
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(errorMessage);
    }
};

//fetch the schedule event details
export const GetScheduleRecords = async (tenantId, coachId) => {
  if (!tenantId || !coachId) {
    throw new Error("GetScheduleRecords: Both tenantId and coachId are required");
  }

  try {
    const response = await axios.get(`${API_URL}/api/events-fetch/${tenantId}/${coachId}`, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data.data; 
    
  } catch (error) {
    const errorDetail = error.response
      ? error.response.data?.message || error.response.data || error.response.statusText
      : error.message;

    console.error("Error fetching attendance records:", errorDetail);
    throw new Error(`Failed to fetch attendance records: ${errorDetail}`);
  }
};

//update the schedule event details
export const updateScheduleEvent = async (eventId, updateData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/events-update/${eventId}`,
      updateData,
      {
        headers: getAuthHeaders(),
        withCredentials: true,
      }
    );

    return response.data.data;
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message;
    console.error("Error updating event:", errorDetail);
    throw new Error(errorDetail);
  }
};

//delete the schedule event details
export const deleteScheduleEvent = async (eventId, tenantId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/events-delete/${eventId}`,
      {
        headers: getAuthHeaders(),
        data: { tenant_id: tenantId }, 
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message;
    console.error("Error deleting event:", errorDetail);
    throw new Error(errorDetail);
  }
};

//fetch the data API code dashboard
export const fetchDashboardStats = async () => {
  try {
    const token = getToken();    
    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch dashboard data');
    }
    const result = await response.json();
    const payload = result.data || {};
    const s = payload.stats || {};
    const activities = Array.isArray(payload.activities) ? payload.activities : [];
    const goals = Array.isArray(payload.goals_data) ? payload.goals_data : [];
    const mapped = {
      total_players: Number(s.total_players) || 0,
      total_coaches: Number(s.active_coaches ?? s.total_coaches ?? s.totalCoaches ?? s.activeCoaches) || 0,
      total_venues: Number(s.total_venues ?? s.totalVenues) || 0,
      monthlyRevenue: Number(s.monthly_revenue) || 0,
      pendingRegistrations: Number(s.pending_registrations) || 0,
      completionRate: Number(s.completion_rate) || 0,
      totalPlayers: s.total_players || 0,
      playersTrend: null,
      revenueByVenue: [],
      playerDistribution: [],
      registrationGrowth: [],

      recentActivities: activities.map((a, i) => ({
        id: a.id || i,
        action: a.action || '',
        name: a.name || '',
        time: a.activity_time || a.created_at || '',
        type: a.type || null,
      })),

      goals: goals,
      revenueProgress: (() => {
        const rev = Number(s.monthly_revenue || 0);
        const revenueGoal = goals.find(g => /Revenue/i.test(g.title))?.target_val || 300000;
        return revenueGoal ? Math.min(100, Math.round((rev / revenueGoal) * 100)) : 0;
      })(),
      coachUtilization: 0,
      venueOccupancy: 0,
    };
    return mapped;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};

//fetch the baar chart data API
export const fetchBarChartData = async () => {
  try {
    const resp = await api.get("/api/dashboard-graph/stats", {
      withCredentials: true,
    });

    const data = resp?.data?.data ?? resp?.data ?? [];

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(
      "BarChart API Error:",
      error?.response?.data || error?.message || error
    );
    return [];
  }
};


//pie chart data API
export const fetchPieChartData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/api/dashboard-piechart/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || `HTTP ${response.status}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];

    const result = await response.json().catch((e) => {
      console.warn('Failed to parse pie chart JSON response', e);
      return null;
    });

    if (!result) return [];
    return Array.isArray(result.data) ? result.data : [];
    
  } catch (error) {
    console.error('PieChart API Error:', error.message);
    return []; 
  }
};


//line chat show the data API 
export const getrevenuedetails = async () => {
  try {
    const response = await axios.get('/api/revenue');
    // We access response.data.data because of your backend structure { success: true, data: [...] }
    return response.data?.data || [];
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};


//player add the bulk excel sheet API code 
export const uploadPlayersExcelData = async (file) => {
  const headers = getAuthHeaders();
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_URL}/api/players-excel/import`,
    formData,
    {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    }
  );
  return response.data;
};

const handleApiError = (context, error) => {
    console.error(`API Error [${context}]:`, error.response?.data || error.message);
    throw error;
};

//change the profile picture API code
export const updatedprofiledata = async (fileOrFormData) => {
    try {
        const isFormData = fileOrFormData instanceof FormData;
        const isFile = fileOrFormData instanceof File;
        
        let formData;
        if (isFormData) {
            formData = fileOrFormData;
        } else if (isFile) {
            formData = new FormData();
            formData.append('logo', fileOrFormData);
        } else {
            throw new Error('Expected File or FormData object');
        }

        const response = await api.put(`/api/player-logo/update-image`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log("API: Player image updated successfully:", response.data);
        return response.data;
    } catch (error) {
        handleApiError('updatedprofiledata', error);
        throw error; 
    }
};

//venue update the details API code
export const updatedvenuscode = async (id, venueData) => {
    try {
        if (!venueData) throw new Error("Venue data is required");
        const response = await api.put(`/api/update-venue-complete/${id}`, venueData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
        });
        console.log("API: updatedvenuscode: Venue updated successfully:", response.data);
        return response.data;
    } catch (error) {
        handleApiError('updatedvenuscode', error);
    }
};

//coach import the excel sheet API code
export const importExcelInsert = async (file) => {
    try {
        const formData = new FormData();
        formData.append('excelFile', file); 
        const response = await api.post('/api/upload-coaches', formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000 
        });
        return response.data;
    } catch (error) {
        handleApiError('importExcelInsert', error);
    }
};

// Fetch event players by event ID
export const fetchEvents = async () => {
    try {
        console.log("API: fetchEvents: Attempting to send request to", `${api.defaults.baseURL}/api/events`);
        const response = await api.get('/api/events', {
            headers: getAuthHeaders(),
        });

        const actualServerData = response.data;
        console.log("API: fetchEvents: Received data:", actualServerData);
        if (Array.isArray(actualServerData)) {
            console.log("API: fetchEvents: Fetched successfully. Count:", actualServerData.length);
            return actualServerData;
        } else if (actualServerData && Array.isArray(actualServerData.events)) {
            console.warn("API: fetchEvents: Data is an object with 'events' array. Extracting property.");
            return actualServerData.events;
        }

        return []; 
        
    } catch (error) {
        console.error("API: fetchEvents: Error fetching data:", error.response?.data || error.message);
        throw error; 
    }
};


//fech the attendance data API code
export const uploadimageducoment = async (formData) => {
  try {
    const response = await api.put(
      "/api/player/update-details",
      formData, 
      {
        headers: {
          ...getAuthHeaders(),
        },
        timeout: 10000,
      }
    );

    console.log("API: Player details updated successfully:", response.data);
    return response.data;
  } catch (error) {
    handleApiError("updateCustomer", error);
    throw error;
  }
};

//fetch the payement hostory details API code
export const fetchPaymentsDetails = async (email) => {
  try {
    if (!email) throw new Error('Email is required.');

    let token = readTokenFromStorage();
    if (!token) {
      const refreshed = await tryRefreshToken();
      if (refreshed) token = readTokenFromStorage();
    }
    if (!token) throw new Error('Please log in again.');
    const response = await api.get(`/api/payment-details/${encodeURIComponent(email.trim())}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];    
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }    
    console.error("Fetch Error:", error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch payment records.');
  }
};


// fetch the user profile details API code
export const fetchUserProfile = async () => {
  try {
    const token = readTokenFromStorage();
    if (!token) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
      }
    }
    try {
      const response = await api.get('/api/users-fetch', { withCredentials: true });
      return response.data?.data ?? response.data;
    } catch (innerErr) {
      const status = innerErr?.response?.status;
      if (status === 401 || status === 403) {
        console.error("Auth error fetching user profile:", innerErr?.response?.data || innerErr.message || innerErr);
        throw innerErr;
      }

      try {
        const playersResp = await api.get('/api/players', { withCredentials: true });
        const players = playersResp.data?.players ?? playersResp.data ?? [];
        return players.map((p) => ({
          tenant_id: p.tenant_id || p.tenantId || null,
          full_name: p.full_name || p.name || p.guardian_name || p.login_email || p.email || "Unknown",
          role: p.role || "parent",
          guardian_email_id: p.guardian_email_id || p.login_email || p.email_id || p.email || null,
          created_at: p.created_at || p.createdAt || null,
        }));
      } catch (fb) {
        console.warn("Fallback /api/players also failed:", fb?.response?.data || fb.message || fb);
        throw innerErr || fb;
      }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error?.response?.data || error.message || error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch user profile.');
  }
};


//user id deactived API code
export const deactivateUser = async (userId) => {
  try {
    const response = await api.put(
      `/api/deactivate-user/${userId}`,
      {}, // Empty body is correct for a PUT if the ID is in the URL
      {
        headers: {
          ...getAuthHeaders(), // Ensure this returns { Authorization: "Bearer <token>" }
          "Content-Type": "application/json"
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    // Log the specific response from server to see why it is forbidden
    console.error("Backend returned 403:", error.response?.data);
    throw new Error(error.response?.data?.message || "Forbidden: You do not have permission.");
  }
};


export const updateUserAcademy = async (settings) => {
  try {
    // Map Frontend camelCase to Backend snake_case
    const payload = {
      id: settings.id, // Include if updating
      site_name: settings.siteName,
      default_currency: settings.defaultCurrency,
      founding_date: settings.foundingDate,
      active_since: settings.activeSince,
      validity: settings.validity,
      address: settings.address,
      notifications_enabled: settings.notificationsEnabled,
      auto_backup: settings.autoBackup,
      is_active: true // Defaulting to true
    };

    // Use the configured `api` instance (has baseURL + auth interceptors)
    const response = await api.post('/api/academy-settings', payload);
    // Return response.data directly because your backend returns result.rows[0]
    return response.data;
  } catch (error) {
    console.error("API Update Error:", error.response?.data || error.message);
    throw error;
  }
};

///fetch the academy settings details API code
export const fetchAcademySettings = async () => {
  try {
    const response = await api.get('/api/academy-settingsdata', { 
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("API Fetch Error:", error.response?.data || error.message);
    throw error;
  } 
};