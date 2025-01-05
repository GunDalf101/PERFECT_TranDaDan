import React, { createContext, useState, useContext, useEffect } from 'react';


const UserContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false
});


const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedIsAuthenticated = localStorage.getItem('isAuthenticated');
    return storedIsAuthenticated === 'true';
  });

  
  useEffect(() => {
    console.log('useEffect: isAuthenticated updated:', isAuthenticated);
  }, [isAuthenticated]); 

  const login = (userData) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('access_token');
    // localStorage.removeItem('oauth2_state');
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