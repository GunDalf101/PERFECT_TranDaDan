import React, { createContext, useState, useContext, useEffect } from 'react';
import {getMyData} from '../../api/authServiceMe'

const UserContext = createContext({
  user: null,
  login: () => { },
  logout: () => { },
  isAuthenticated: false
});

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const data = await getMyData();
        const userJSON = JSON.stringify(data);
        setUser(userJSON);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error validating token:', error);
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('access_token');
      }
    };

    checkAuthStatus();
  }, [user,isAuthenticated]);



  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('access_token');
  };

  const contextValue = {
    user,
    login,
    logout,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};


const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Example of correct Consumer usage if needed
const UserConsumer = ({ children }) => {
  return (
    <UserContext.Consumer>
      {(context) => {
        if (context === undefined) {
          throw new Error('UserConsumer must be used within a UserProvider');
        }
        return children(context);
      }}
    </UserContext.Consumer>
  );
};

export { UserProvider, useUser, UserConsumer };
export default UserContext;
