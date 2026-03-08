import { MapContainer, TileLayer, Circle } from "react-leaflet";
import UserLocationMarker from "./UserLocationMarker";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const backendUrl = process.env.REACT_APP_BACKEND_URL;
const socket = io(backendUrl);

export default function MapView(){

  const [zones,setZones] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const center = [30.7333,76.7794];

  useEffect(()=>{

    fetch(`${backendUrl}/api/zones/zones`)
      .then(res => {
        if (!res.ok) {
          setFetchError(`Error: ${res.status} ${res.statusText}`);
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setZones(data);
        } else {
          setFetchError('Zones data is not an array');
          setZones([]);
        }
      })
      .catch(err => {
        setFetchError(err.message);
        setZones([]);
      });

  },[]);


  useEffect(()=>{

    socket.on("zone-created",(zone)=>{
      setZones(prev=>[...prev,zone]);
    });

    socket.on("near-zone-alert",()=>{
      alert("You are near a danger zone");
    });

    socket.on("zone-entered",()=>{
      alert("You entered a danger zone");
    });

  },[]);


  return(

    <>
      {fetchError && <div style={{color:'red',padding:'8px'}}>Failed to load zones: {fetchError}</div>}
      <MapContainer
        center={center}
        zoom={14}
        style={{height:"100vh",width:"100%"}}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(Array.isArray(zones) ? zones : []).map(zone=>(
          <Circle
            key={zone._id}
            center={[zone.latitude,zone.longitude]}
            radius={100}
            pathOptions={{color:"red"}}
          />
        ))}
        <UserLocationMarker />
      </MapContainer>
    </>
  );

}