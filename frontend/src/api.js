const API_BASE_URL = "http://127.0.0.1:5000"; // URL del backend

// ✅ Función para obtener las categorías desde la API
export const fetchCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error("Error al obtener categorías");
        const data = await response.json();
        return data.categories; // Devuelve la lista de categorías
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        return []; // Retorna un array vacío si hay un error
    }
};

// ✅ Función para obtener los lugares filtrados
export const fetchPlaces = async (lat, lng, category = "all") => {
    let url = `${API_BASE_URL}/places?lat=${lat}&lng=${lng}&radius=5000`;

    if (category !== "all") {
        url += `&category=${category}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status} al obtener lugares`);
        const data = await response.json();
        return data; // Retorna la lista de lugares
    } catch (error) {
        console.error("Error al obtener los lugares:", error);
        return []; // Retorna un array vacío si hay error
    }
};
