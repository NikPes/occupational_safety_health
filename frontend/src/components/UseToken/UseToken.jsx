import { useState } from 'react';

function UseToken() {

  function getToken() {
    try {
        const userToken = localStorage.getItem('token');
        return userToken || null;
    } catch (error) {
        console.error("Error reading token from localStorage:", error);
        return null;
    }
  }

  const [token, setToken] = useState(getToken());

  function saveToken(userToken) {
    localStorage.setItem('token', userToken);
    setToken(userToken);
  }

  function clearToken() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return {
    setToken: saveToken,
    token,
    clearToken
  }

}

export default UseToken;