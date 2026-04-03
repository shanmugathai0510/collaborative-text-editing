import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

function App() {
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const socket = useRef();

  // Assign random gender when user connects
  const getRandomGender = () => {
    return Math.random() < 0.5 ? 'male' : 'female';
  };

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    
    // Send gender to server when connecting
    socket.current.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
      // Send gender to server
      socket.current.emit("set-gender", getRandomGender());
    });
    
    socket.current.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });
    
    socket.current.on("init", (data) => {
      console.log("Document loaded", data);
      setContent(data.content);
      setUsers(data.users);
    });
    
    socket.current.on("text-update", (data) => {
      setContent(data.content);
    });
    
    socket.current.on("user-joined", (user) => {
      setUsers(prev => [...prev, user]);
    });
    
    socket.current.on("user-left", (id) => {
      setUsers(prev => prev.filter(u => u.id !== id));
    });
    
    socket.current.on("users-list", (list) => {
      setUsers(list);
    });
    
    return () => socket.current.disconnect();
  }, []);
  
  const handleChange = (e) => {
    let newContent = e.target.value;
    
    // First time typing - clear welcome text
    if (!hasTyped && newContent.length > 0) {
      newContent = newContent.replace("Welcome to Collaborative Editor!\n\nStart typing here...", "");
      setHasTyped(true);
    }
    
    setContent(newContent);
    socket.current.emit("text-change", { content: newContent });
  };
  
  // Get icon based on gender
  const getGenderIcon = (gender) => {
    if (gender === 'male') {
      return '👨';
    } else if (gender === 'female') {
      return '👩';
    }
    return '👤';
  };
  
  // Get color based on gender
  const getGenderColor = (gender) => {
    if (gender === 'male') {
      return '#4A90D9';  // Blue for male
    } else if (gender === 'female') {
      return '#E84393';  // Pink for female
    }
    return '#95A5A6';    // Gray for neutral
  };
  
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px"
      }}>
        <h1 style={{ margin: 0 }}>📝 Collaborative Text Editor</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: connected ? "#10b981" : "#ef4444"
          }}></div>
          <span>{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>
      
      {/* Users Section - Only icons, no text */}
      <div style={{
        background: "white",
        borderRadius: "10px",
        padding: "10px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap"
      }}>
        <strong>👥 Online ({users.length}):</strong>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "5px 10px",
                borderRadius: "10px",
                background: getGenderColor(u.gender) + '20',
                border: `1px solid ${getGenderColor(u.gender)}`
              }}
            >
              <span style={{ fontSize: "24px" }}>
                {getGenderIcon(u.gender)}
              </span>
              {/* No text - only icon */}
            </div>
          ))}
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={handleChange}
        style={{
          width: "100%",
          minHeight: "500px",
          padding: "20px",
          fontSize: "16px",
          borderRadius: "10px",
          border: "none",
          fontFamily: "monospace",
          resize: "vertical"
        }}
        placeholder="Start typing..."
      />
      
      <div style={{
        color: "white",
        textAlign: "center",
        marginTop: "20px",
        opacity: 0.8
      }}>
        💡 Open multiple browser windows to see real-time collaboration!
      </div>
    </div>
  );
}

export default App;