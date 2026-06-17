export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "Unknown"
  );
};

export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    if (data.address) {
      const { city, state, country } = data.address;
      return `${city || state || ""}, ${country || ""}`.trim().replace(/^, /, "");
    }
    return null;
  } catch (err) {
    console.warn("Reverse geocoding failed:", err.message);
    return null;
  }
};
