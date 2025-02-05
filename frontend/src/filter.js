export const filterPlacesByCategory = (places, category) => {
    if (category === "all") return places;
    return places.filter(place => place.categoria === category);
};

