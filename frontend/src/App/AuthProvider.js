import React, { createContext, useState, useContext, useEffect } from 'react';
import { secureLocalStorage } from './SecureStorage'

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(secureLocalStorage.getToken() ? true : false);
    const [roles, setRoles] = useState(secureLocalStorage.getUserRoles() || []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, roles, setRoles }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthInterval() {
  const { isLoggedIn, setIsLoggedIn, roles } = useContext(AuthContext);
  useEffect(() => {
    const intervalId = setInterval(() => {
      const jwtKey = secureLocalStorage.getToken();
      if (isLoggedIn && !jwtKey) {
        // Clear the interval and do something
        clearInterval(intervalId)
        setIsLoggedIn(false)
        console.log('The JWT key is invalid.');
      }
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  return (
    <div>
    </div>
  );
}



function hasCommonObject(array1, array2) {
  if(!array1 || !array2) return false
  return array1.some(item1 => array2.some(item2 => item1 === item2));
}

export const AuthorizeView = ( props ) => {
  const { isLoggedIn,roles } = useContext(AuthContext);

  if (isLoggedIn && (!props.roles || hasCommonObject(roles, props.roles))) {
    return (
      <>
        {React.Children.map(props.children, (child) =>
          child.type === Authorized ? React.cloneElement(child, { roles:props.roles }) : null
        )}
      </>
    );
  } else {
    return (
      <>
        {React.Children.map(props.children, (child) =>
          child.type === NotAuthorized ? child : null
        )}
      </>
    );
  }
};


export const Authorized = ( props ) => {
  const { isLoggedIn,roles } = useContext(AuthContext);
  
  if (isLoggedIn && (!props.roles || hasCommonObject(roles, props.roles))) {
    return <>{props.children}</>;
  } else {
    return null;
  }
};

export const NotAuthorized = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <>{children}</>;
  } else {
    return null;
  }
};
