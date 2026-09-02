import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/api";


/*
  Create Authentication Context
*/

const AuthContext = createContext(null);


/*
  Authentication Provider
*/

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(() => {
    return localStorage.getItem("token") !== null;
  });


  /*
    Restore authentication after
    browser refresh
  */

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    getCurrentUser()
      .then((data) => {

        setUser(data.user);

      })
      .catch((error) => {

        console.error(
          "Authentication restore failed:",
          error.message
        );

        localStorage.removeItem("token");

        setUser(null);

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);


  /*
    LOGIN
  */

  const login = async (email, password) => {

  const data = await loginUser({
    email,
    password,
  });

  if (!data?.token) {
    throw new Error(
      "Login successful but JWT token was not received."
    );
  }

  localStorage.setItem(
    "token",
    data.token
  );

  setUser(data.user);

  return data;
};


  /*
    REGISTER
  */

  const register = async (
  name,
  email,
  password,
  confirmPassword
) => {

  const data = await registerUser({
    name,
    email,
    password,
    confirmPassword,
  });

  return data;
};


  /*
    LOGOUT
  */

  const logout = () => {

    localStorage.removeItem("token");

    setUser(null);

  };


  /*
    Context value
  */

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


/*
  useAuth Hook - Custom hook for accessing auth context
  Must be used inside AuthProvider
*/

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }

  return context;
};