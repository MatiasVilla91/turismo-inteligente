import React from "react";
import Home from "./Home"; // Asegúrate de que Home.js esté en la misma carpeta src
import Navbar from "./Navbar";
import Footer from "./Footer";


function App() {
    return (
        <div>
            <Navbar/>
            <Home />
            <Footer/>
            
        </div>
    );
}

export default App;
