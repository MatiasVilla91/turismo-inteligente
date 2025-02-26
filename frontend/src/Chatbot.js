// Chatbot.js - Componente de chat en React
import React, { useState, useEffect } from "react";
import axios from "axios";

const Chatbot = ({ setCoordenadas }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState("");

    // Obtener user_id de localStorage al cargar el componente
    useEffect(() => {
        let storedUserId = localStorage.getItem("user_id");

        if (!storedUserId) {
            storedUserId = "user_" + Math.random().toString(36).substring(7); // Generar un ID aleatorio
            localStorage.setItem("user_id", storedUserId);
        }

        setUserId(storedUserId);
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages([...messages, userMessage]);

        try {
            const response = await axios.post("http://localhost:5000/chatbot", { 
                user_id: userId, // 🔥 Ahora enviamos el user_id
                mensaje: input 
            });

            const botMessage = { sender: "bot", text: response.data.respuesta };
            setMessages(prevMessages => [...prevMessages, botMessage]);
            // 🚀 Si el chatbot devuelve coordenadas, las pasamos al mapa
            if (response.data.coordenadas.length > 0) {
                const newCenter = response.data.coordenadas[0]; // Tomamos la primera coordenada
                setCoordenadas(newCenter); // Movemos el mapa a la nueva coordenada
            }
            } catch (error) {
            console.error("❌ Error al enviar mensaje al chatbot:", error);
        }

        setInput("");
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>{msg.text}</div>
                ))}
            </div>
            <div className="chatbot-input">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Escribe un mensaje..."
                />
                <button onClick={sendMessage}>Enviar</button>
            </div>
        </div>
    );
};

export default Chatbot;