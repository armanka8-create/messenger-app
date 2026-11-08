import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../socket';
import { userAPI } from '../api';
import './Chat.css';

function Chat({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const socket = getSocket();

  useEffect(() => {
    loadUsers();
    setupSocketListeners();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
      socket.emit('mark-read', { fromUserId: selectedUser.id });
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await userAPI.getMessages(userId);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const setupSocketListeners = () => {
    socket.on('receive-message', (message) => {
      if (selectedUser && (message.from_user_id === selectedUser.id || message.to_user_id === selectedUser.id)) {
        setMessages(prev => [...prev, message]);
        if (message.from_user_id === selectedUser.id) {
          socket.emit('mark-read', { fromUserId: selectedUser.id });
        }
      }
    });

    socket.on('user-status', ({ userId, status }) => {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status, online: status === 'online' } : u
      ));
    });

    socket.on('user-typing', ({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // WebRTC call signaling
    socket.on('incoming-call', async ({ fromUserId, fromUsername, offer, callType }) => {
      setIncomingCall({ fromUserId, fromUsername, offer, callType });
    });

    socket.on('call-answered', async ({ answer }) => {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('call-ended', () => {
      endCall();
    });
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedUser) return;

    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      from_user_id: user.id,
      to_user_id: selectedUser.id,
      content: messageInput,
      timestamp: Math.floor(Date.now() / 1000),
      sending: true
    };

    setMessages(prev => [...prev, tempMessage]);
    socket.emit('send-message', {
      toUserId: selectedUser.id,
      content: messageInput,
      tempId
    });

    setMessageInput('');
    socket.emit('typing', { toUserId: selectedUser.id, isTyping: false });
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);

    if (!selectedUser) return;

    socket.emit('typing', { toUserId: selectedUser.id, isTyping: true });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { toUserId: selectedUser.id, isTyping: false });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // WebRTC functions
  const createPeerConnection = () => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate && selectedUser) {
        socket.emit('ice-candidate', {
          toUserId: selectedUser.id,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteStreamRef.current = event.streams[0];
      }
    };

    return pc;
  };

  const startCall = async (callType) => {
    if (!selectedUser) return;

    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnectionRef.current = createPeerConnection();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit('call-user', {
        toUserId: selectedUser.id,
        offer,
        callType
      });

      setIsInCall(true);
    } catch (err) {
      console.error('Failed to start call:', err);
      alert('Could not access camera/microphone');
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnectionRef.current = createPeerConnection();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit('call-answer', {
        toUserId: incomingCall.fromUserId,
        answer
      });

      setIsInCall(true);
      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Could not access camera/microphone');
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('end-call', { toUserId: incomingCall.fromUserId });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (selectedUser) {
      socket.emit('end-call', { toUserId: selectedUser.id });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsInCall(false);
    setIncomingCall(null);
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
        
        <div className="user-profile">
          <div className="avatar">{user.display_name[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{user.display_name}</div>
            <div className="user-status">@{user.username}</div>
          </div>
        </div>

        <div className="users-list">
          {users.map(u => (
            <div
              key={u.id}
              className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="avatar">{u.display_name[0].toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{u.display_name}</div>
                <div className="user-username">@{u.username}</div>
              </div>
              <div className={`status-indicator ${u.online ? 'online' : 'offline'}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div>
                <h3>{selectedUser.display_name}</h3>
                <span className="status">
                  {selectedUser.online ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
              <div className="call-buttons">
                <button onClick={() => startCall('voice')} disabled={isInCall} title="Voice Call">
                  📞
                </button>
                <button onClick={() => startCall('video')} disabled={isInCall} title="Video Call">
                  📹
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`message ${msg.from_user_id === user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {typingUsers.has(selectedUser.id) && (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <input
                type="text"
                value={messageInput}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>

            {/* Call UI */}
            {isInCall && (
              <div className="call-overlay">
                <div className="call-container">
                  <h3>Call with {selectedUser.display_name}</h3>
                  <div className="video-container">
                    <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                    <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                  </div>
                  <button onClick={endCall} className="end-call-btn">End Call</button>
                </div>
              </div>
            )}

            {/* Incoming Call */}
            {incomingCall && (
              <div className="call-overlay">
                <div className="incoming-call">
                  <h3>📞 Incoming {incomingCall.callType} call</h3>
                  <p>{incomingCall.fromUsername}</p>
                  <div className="call-actions">
                    <button onClick={answerCall} className="answer-btn">Answer</button>
                    <button onClick={rejectCall} className="reject-btn">Reject</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>Select a chat to start messaging</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
