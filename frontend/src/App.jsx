import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import { connectSocket, disconnectSocket } from './socket';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        connectSocket(storedToken);
      } catch (err) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    connectSocket(authToken);
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <div className="App">
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Chat user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
