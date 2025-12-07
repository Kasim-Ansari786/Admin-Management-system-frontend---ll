// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { signupUser, loginUser } from "../../api"; // Make sure path is correct
// Create the context
const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const USER_KEY = "authUser";
const SESSION_KEY = "authSession";


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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ----------- LOGIN function (Calls the corrected loginUser API function) ----------
  const login = async (email, password, role) => {
    setError(null);
    setIsLoading(true);

    // Call the API function
    const { data, error: apiError } = await loginUser({ email, password, role });
    
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return { error: apiError };
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
    
    setIsLoading(false);
    return {};
  };

  // Function to handle SIGNUP
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
    
    setIsLoading(false);
    return {};
  };

  // Function to handle LOGOUT
  const logout = () => {
    setUser(null);
    setSession(null);
    setError(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
  };

  // Value provided by the context
  const value = { 
    user, 
    session, // session contains the accessToken and user info
    token: session ? session.accessToken : null, // Convenience token access
    login, 
    signup, 
    logout, 
    isLoading, // Important for showing loading state while checking localStorage
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};