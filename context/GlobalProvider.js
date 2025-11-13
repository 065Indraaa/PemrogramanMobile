import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../lib/appwrite";

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userVideos, setUserVideos] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [videosRefreshTrigger, setVideosRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await getCurrentUser();
        if (res) {
          setIsLoggedIn(true);
          setUser(res);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  // Trigger refresh across all pages
  const triggerVideosRefresh = () => {
    setVideosRefreshTrigger(prev => prev + 1);
  };

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        isLoading,
        userVideos,
        setUserVideos,
        allVideos,
        setAllVideos,
        videosRefreshTrigger,
        triggerVideosRefresh,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
