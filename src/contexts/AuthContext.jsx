import React, { createContext, useContext, useState, useEffect } from "react";
import { signupUser, loginUser } from "../../api"; 

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const USER_KEY = "authUser";
const SESSION_KEY = "authSession";

export const getLoggedInUserId = () => {
    try {
        const userJson = localStorage.getItem(USER_KEY);
        if (userJson) {
            const user = JSON.parse(userJson);
            const tenantId = user._id || user.id || user.user_id || user.userId || null;
            
            if (tenantId) {
                 return String(tenantId);
            }
        }
    } catch (e) {
        console.error("Error retrieving user ID from storage:", e);
    }
    return null; 
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem(USER_KEY));
      const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY));

      if (savedUser && savedSession && savedSession.accessToken) {
        // normalize role to lowercase for consistent checks across the app
        if (savedUser.role && typeof savedUser.role === "string") {
          savedUser.role = savedUser.role.toLowerCase();
        }
        setUser(savedUser);
        setSession(savedSession);
      }
    } catch (e) {
      console.error("Failed to load auth state from storage:", e);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    setError(null);
    setIsLoading(true);
    
    try {
        const apiResponse = await loginUser({ email, password, role });
        const { data, error: apiError } = apiResponse;
        
        if (apiError || !data || !data.token || !data.user) {
            throw new Error(apiError || "Invalid response from login API.");
        }

        // The user object from your login API contains 'logo'
        const newUser = data.user;
        if (newUser && newUser.role && typeof newUser.role === "string") {
          newUser.role = newUser.role.toLowerCase();
        }
        const newSession = {
          accessToken: data.token,
          user: newUser,
        };

        setUser(newUser);
        setSession(newSession);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        // Keep legacy `user` key in sync for components that read it directly
        try { localStorage.setItem('user', JSON.stringify(newUser)); } catch (e) {}
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('token', data.token); // Save with 'token' key as well for api.js compatibility
        
        setIsLoading(false);
        return { success: true, user: newUser };
    } catch (apiError) {
        const errorMessage = apiError.message || "An unknown login error occurred.";
        setError(errorMessage);
        setIsLoading(false);
        return { error: errorMessage };
    }
  };

  const signup = async (...args) => {
    setError(null);
    setIsLoading(true);
    const { data, error: apiError } = await signupUser(...args);
    
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return { error: apiError };
    }
    const newUser = data.user;
    if (newUser && newUser.role && typeof newUser.role === "string") {
      newUser.role = newUser.role.toLowerCase();
    }
    const newSession = { accessToken: data.token, user: newUser };

    setUser(newUser);
    setSession(newSession);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    try { localStorage.setItem('user', JSON.stringify(newUser)); } catch (e) {}
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('token', data.token); // Save with 'token' key as well for api.js compatibility
    
    setIsLoading(false);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    setError(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // Also remove 'token' key
    try { localStorage.removeItem('user'); } catch (e) {}
  };

  /**
   * FIX: Changed 'avatar' to 'logo' to match your API and Header logic.
   */
  const updateAvatar = (newLogoUrl) => {
    try {
      if (!newLogoUrl) return;
      
      setUser((prev) => {
        const updated = { ...(prev || {}), logo: newLogoUrl };
        try {
          const stored = JSON.parse(localStorage.getItem(USER_KEY)) || {};
          stored.logo = newLogoUrl;
          localStorage.setItem(USER_KEY, JSON.stringify(stored));
          // keep legacy `user` in sync
          try { localStorage.setItem('user', JSON.stringify(stored)); } catch (e) {}
        } catch (e) {}
        return updated;
      });

      setSession((prev) => {
        if (!prev) return prev;
        const updatedSession = { 
            ...prev, 
            user: { ...(prev.user || {}), logo: newLogoUrl } 
        };
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
          try { localStorage.setItem('user', JSON.stringify(updatedSession.user)); } catch (e) {}
        } catch (e) {}
        return updatedSession;
      });
    } catch (e) {
      console.error('updateAvatar error', e);
    }
  };

  const value = { 
    user, 
    session, 
    token: session ? session.accessToken : null, 
    authToken: session ? session.accessToken : (localStorage.getItem('authToken') || null),
    login, 
    signup, 
    logout, 
    updateAvatar,
    isLoading, 
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};