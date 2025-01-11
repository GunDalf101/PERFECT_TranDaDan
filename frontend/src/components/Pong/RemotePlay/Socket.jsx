import React, { useState, useEffect } from "react";
import RemoteMode from "./RemoteMode";

function SocketPong({ roomName }) {
    const [zPosition, setZPosition] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8000/ws/game/100/`);
 
        socket.onopen = () => {
            console.log("WebSocket connected!");
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received data:", data);
        };
        
        socket.onclose = () => {
            console.log("WebSocket closed.");
        };
    }, [roomName]);

    const handleMouseMove = (e) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const mousePosition = { x: e.clientX, y: e.clientY };
            ws.send(JSON.stringify({ mouse_position: mousePosition }));
        }
    };
    return (
        <div onMouseMove={handleMouseMove}>
            {console.log(zPosition)}
        </div>
    );
}

export default SocketPong;
