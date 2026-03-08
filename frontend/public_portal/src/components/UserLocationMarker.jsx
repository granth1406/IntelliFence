import { useState, useEffect } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import userMarkerImg from "../assets/user-marker.png";

export default function UserLocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        map.setView(coords, map.getZoom());
      },
      (err) => {
        // Optionally handle error
      },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [map]);

  if (!position) return null;
  const icon = L.icon({
    iconUrl: userMarkerImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
  return <Marker position={position} icon={icon} />;
}
