import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getCurrentUser,
  signIn as appwriteSignIn,
  signOut as appwriteSignOut,
} from "../lib/appwrite";

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile doc from DB and update context
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCurrentUser();
      if (res) {
        setIsLoggedIn(true);
        setUser(res);
        return res;
      } else {
        setIsLoggedIn(false);
        setUser(null);
        return null;
      }
    } catch (err) {
      console.log("refreshUser error:", err);
      setIsLoggedIn(false);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Try to load existing session/profile on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await refreshUser();
    })();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  // Wrapper to sign in and refresh profile doc
  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      try {
        await appwriteSignIn(email, password);
        const profile = await refreshUser();
        return profile;
      } catch (err) {
        console.log("GlobalProvider login error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUser]
  );

  // Wrapper to sign out and clear local context
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await appwriteSignOut();
    } catch (err) {
      console.warn("GlobalProvider logout warning:", err);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        isLoading,
        refreshUser, // callable from any component
        login, // use this in Login screen to ensure context updates
        logout, // use this to sign out and clear context
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;