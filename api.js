import axios from "axios";

// --- Configuration ---
const API_URL = "http://localhost:5000";
const TOKEN_KEY = "token";
const REFRESH_KEY = "refreshToken"; // Refresh Token Key

// --- Storage Utilities ---

const readTokenFromStorage = () => {
  // Backwards-compatibility: also check for legacy 'authToken' key used elsewhere
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
  // persist = true => localStorage, false => sessionStorage
  const storage = persist ? localStorage : sessionStorage;

  // Clear session storage if persisting to local, and vice-versa, to ensure one source of truth
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
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }), 
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || "Login failed.";
      return { data: null, error: errorMessage };
    }
    // Save tokens if provided by the backend (access token and optional refresh token)
    const accessToken = data.token ?? data.accessToken ?? null;
    const refreshToken = data.refreshToken ?? null;

    if (accessToken) {
      // Persist tokens to localStorage by default
      saveTokensToStorage({ token: accessToken, refreshToken, persist: true });
    }

    // Also persist the user object using saveAuth helper
    if (data.user) {
      saveAuth({ token: accessToken, user: data.user });
    }

    return {
      data: {
        user: data.user,
        token: accessToken,
        refreshToken,
        role: data.user?.role,
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
    const response = await axios.get(`${API_URL}/api/coaches-list`, {
      headers: getAuthHeaders(), 
      withCredentials: true, 
    });

    return response.data;
  } catch (error) {
    const errorDetail = error.response 
        ? error.response.data || error.response.statusText 
        : error.message;

    console.error("Error fetching coach details:", errorDetail);
    throw new Error(`Failed to fetch coach details: ${errorDetail}`);
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

export const AddCoachdata = async (apiData) => {
  const headers = getAuthHeaders();

  try {
    const response = await api.post('/api/coaches', apiData, {
      headers,
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    console.error('Error in AddCoachdata:', err?.response ?? err.message ?? err);
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to add coach');
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
export const UpdateCoachdata = async (apiData) => {
  const idValue = apiData?.coach_id ?? apiData?.id;
  if (!idValue) {
    throw new Error("Missing coach_id when calling UpdateCoachdata.");
  }
  const payload = {
    coach_id: idValue,
    coach_name: apiData?.coach_name ?? apiData?.name ?? null,
    phone_numbers: apiData?.phone_numbers ?? null,
    email: apiData?.email ?? null,
    location: apiData?.location ?? null,
    salary:
      apiData?.salary !== undefined && apiData.salary !== null && apiData.salary !== ""
        ? (() => {
            const parsed = parseFloat(apiData.salary);
            return Number.isFinite(parsed) ? parsed : null;
          })()
        : null,
    week_salary: apiData?.week_salary ?? null,
    active: apiData?.active !== undefined ? apiData.active : null,
    status: apiData?.status ?? null,
  };
  const endpoint = `${API_URL}/api/coaches-update/${encodeURIComponent(idValue)}`;
  try {
    const response = await axios.put(endpoint, payload, {
      headers: getAuthHeaders(),
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const serverData = error?.response?.data ?? null;
    const serverMsg =
      serverData?.message || serverData?.error || error.message || String(error);
    console.error(`API Call Failed (${endpoint}):`, serverData ?? error);
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

export async function AssignCoachupdated(coach_name, coach_code, player_id, id) {
  try {
    // Use centralized axios instance so headers, timeouts and interceptors are consistent
    const resp = await api.post(
      "/api/update-coach",
      { coach_name, coach_code, player_id, id },
      { headers: { "Content-Type": "application/json" } }
    );

    return resp.data;
  } catch (error) {
    console.error("AssignCoachupdated error:", error?.response?.data ?? error.message ?? error);
    // Normalize thrown error so callers can inspect message and status
    const err = new Error(error?.response?.data?.error || error?.message || "Failed to assign coach");
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
          console.warn("Token invalid or expired. User needs to re-authenticate.");
          throw new Error("Unauthorized: Invalid or expired token.");
      }
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
    // `getAuthHeaders` returns an object of headers; to read the raw token use `getToken`.
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

// ---------------------------------------------
// Fetch the parent's players by guardian email
export const getPlayerDetailsByGuardianEmail = async (email, maybePlayerIdOrToken, maybeToken) => {

  let playerId = null;
  let token = null;

  if (maybeToken !== undefined) {
    // Called with (email, playerId, token)
    playerId = maybePlayerIdOrToken;
    token = maybeToken;
  } else {
    // Called with (email, token)
    token = maybePlayerIdOrToken;
  }

  if (!email || !token) {
    throw new Error("Missing required credentials (email or token).");
  }

  try {
    if (playerId) {
      // Fetch single player by id
      const response = await fetch(`${API_URL}/api/player-details/${encodeURIComponent(email)}/${playerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch (e) {}
        throw new Error(`API Error ${response.status}: ${errorData.error || errorData.message || "Failed to fetch player data."}`);
      }

      const childData = await response.json();
      return {
        player_id: childData.player_id,
        name: childData.name,
        age: childData.age,
        center: childData.center,
        coach: childData.coach,
        position: childData.position,
        phone_no: childData.phone_no,
        player_email: childData.player_email,
        attendance_percentage: parseFloat(childData.attendance_percentage) || 0,
        recent_activities: childData.recent_activities_json || [],
      };
    }

    // No playerId -> fetch all players for the guardian
    const listResp = await fetch(`${API_URL}/api/player-details-by-guardian/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!listResp.ok) {
      let errData = {};
      try { errData = await listResp.json(); } catch (e) {}
      throw new Error(`API Error ${listResp.status}: ${errData.error || errData.message || "Failed to fetch players list."}`);
    }

    const rows = await listResp.json();
    // Return array (frontend expects an array)
    return Array.isArray(rows) ? rows.map((child) => ({
      player_id: child.player_id,
      name: child.name,
      age: child.age,
      center: child.center,
      coach: child.coach,
      position: child.position,
      phone_no: child.phone_no,
      player_email: child.player_email,
      attendance_percentage: parseFloat(child.attendance_percentage) || 0,
      recent_activities: child.recent_activities_json || [],
    })) : [];

  } catch (err) {
    console.error("Error fetching player details:", err.message || err);
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
    if (error.response) {
       console.error("Error fetching coach players data:", error.response.data);
    } else {
       console.error("Network / unknown error fetching coach players:", error.message);
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
    // Use shared `api` instance so Authorization header + refresh logic apply
    const response = await api.get('/api/payments');
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Error fetching payment details:", error?.response ?? error.message ?? error);
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      throw new Error('Unauthorized. Please log in again.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payment records.');
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
            const errorBody = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
            throw new Error(errorBody.error || errorBody.message || `Failed to update payment record ${paymentId}.`);
        }

        return response.json(); 
    } catch (error) {
        console.error(`❌ Error updating payment ${paymentId}:`, error);
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

    // backend returns an array of rows
    return response.data;
  } catch (error) {
    const errorDetail = error.response
      ? error.response.data?.message || error.response.data || error.response.statusText
      : error.message;

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
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/dashboard-graph/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch bar chart data';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error('BarChart API Error:', error.message);
    throw error;
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
      // Try to parse JSON error, but guard against HTML responses
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
    const response = await api.get('/api/revenue');
    return response.data?.data || [];
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};