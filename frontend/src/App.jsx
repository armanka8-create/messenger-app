import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import { connectSocket, disconnectSocket } from './socket';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        connectSocket(storedToken);
      } catch (err) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    connectSocket(authToken);
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.clear();
    setUser(null);
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
