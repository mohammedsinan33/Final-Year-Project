import { createContext, useContext, useState, useEffect } from "react";
import { login as loginService, register as registerService } from "../Services/database";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to restore auth state:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const userData = await loginService({ email, password });

      // Store token and user in state and localStorage
      const token = userData.token || userData.id;
      setToken(token);
      setUser(userData);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const register = async (email, password, role, fullName) => {
    try {
      const userData = await registerService({
        email,
        password,
        role,
        fullName,
      });

      // Store token and user in state and localStorage
      const token = userData.token || userData.id;
      setToken(token);
      setUser(userData);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } catch (err) {
      console.error("Register error:", err);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
