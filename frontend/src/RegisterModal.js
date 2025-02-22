import React, { useState } from "react";
import axios from "axios";

const RegisterModal = ({ setUserId, setShowRegisterModal }) => {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");

    const registerUser = async () => {
        if (!nombre || !email) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/register", {
                nombre,
                email
            });

            const newUserId = response.data.user_id;
            localStorage.setItem("user_id", newUserId);
            setUserId(newUserId);
            setShowRegisterModal(false); // 🔥 Cerrar modal después del registro
        } catch (error) {
            console.error("Error al registrar usuario", error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Regístrate para comenzar</h2>
                <input 
                    type="text" 
                    placeholder="Nombre" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={registerUser}>Registrarse</button>
            </div>
        </div>
    );
};

export default RegisterModal;
