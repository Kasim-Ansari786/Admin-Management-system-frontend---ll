// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
// Assuming you have 'signupUser' and 'loginUser' imported from the correct path
import { signupUser, loginUser } from "../../api"; 

// Create the context
const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Standardized keys for localStorage
const USER_KEY = "authUser";
const SESSION_KEY = "authSession";

/**
 * Utility function to retrieve the logged-in user ID (Tenant ID) from local storage.
 * This ID is used to link created records (like player details) back to the logged-in user.
 * It checks for common ID field names in the stored user object.
 */
export const getLoggedInUserId = () => {
    try {
        const userJson = localStorage.getItem(USER_KEY);
        if (userJson) {
            const user = JSON.parse(userJson);
            
            // CRITICAL: Check common ID keys returned by your backend API
            const tenantId = user._id || user.id || user.user_id || user.userId || null;
            
            if (tenantId) {
                 // Debugging log to confirm the ID was found
                 console.log(`DEBUG: Found Tenant ID: ${tenantId}`);
                 // Use String() to ensure compatibility with FormData/database
                 return String(tenantId);
            }
            // Warning if the user object exists but the ID field is missing
            console.warn("WARNING: Logged-in user object found, but no recognized ID key (_id, id, user_id, userId) was present.");
        }
    } catch (e) {
        console.error("Error retrieving user ID from storage:", e);
    }
    // Returns null if not logged in or ID not found
    return null; 
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Store session which contains the token and a user object reference
  const [session, setSession] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stored session on initial mount
  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem(USER_KEY));
      const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY));

      if (savedUser && savedSession && savedSession.accessToken) {
        setUser(savedUser);
        setSession(savedSession);
      }
    } catch (e) {
      console.error("Failed to load auth state from storage:", e);
      // Clear potentially corrupted storage
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('authToken'); // Clear this just in case
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ----------- LOGIN function ----------
  const login = async (email, password, role) => {
    setError(null);
    setIsLoading(true);
    
    try {
        // Assume loginUser returns { data: { token: '...', user: {...} } }
        const apiResponse = await loginUser({ email, password, role });
        const { data, error: apiError } = apiResponse;
        
        if (apiError || !data || !data.token || !data.user) {
            throw new Error(apiError || "Invalid response from login API.");
        }

        // Successful login
        const newUser = data.user;
        const newSession = {
          accessToken: data.token,
          user: newUser,
        };

        setUser(newUser);
        setSession(newSession);

        // Persist state in localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        localStorage.setItem('authToken', data.token); // Store token for easy retrieval in API calls
        
        setIsLoading(false);
        return { success: true, user: newUser };
    } catch (apiError) {
        console.error("Login API Error:", apiError);
        const errorMessage = apiError.response?.data?.error || apiError.message || "An unknown login error occurred.";
        setError(errorMessage);
        setIsLoading(false);
        return { error: errorMessage };
    }
  };

  // Function to handle SIGNUP (included for completeness)
  const signup = async (...args) => {
    setError(null);
    setIsLoading(true);
    
    // Call the API function
    const { data, error: apiError } = await signupUser(...args);
    
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return { error: apiError };
    }

    // Successful signup
    const newUser = data.user;
    const newSession = { accessToken: data.token, user: newUser };

    setUser(newUser);
    setSession(newSession);

    // Persist state in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem('authToken', data.token); 
    
    setIsLoading(false);
    return { success: true, user: newUser };
  };

  // Function to handle LOGOUT
  const logout = () => {
    setUser(null);
    setSession(null);
    setError(null);
    // Clear all auth-related storage
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('authToken'); 
  };

  // Value provided by the context
  const value = { 
    user, 
    session, // session contains the accessToken and user info
    token: session ? session.accessToken : null, // Convenience token access
    // Backwards-compatible field name used across the codebase
    authToken: session ? session.accessToken : (localStorage.getItem('authToken') || null),
    login, 
    signup, 
    logout, 
    isLoading, 
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};