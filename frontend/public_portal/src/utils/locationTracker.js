import io from "socket.io-client";

const backendUrl = process.env.REACT_APP_BACKEND_URL;
const socket = io(backendUrl);

export function startTracking(userId){

  navigator.geolocation.watchPosition((pos)=>{

    socket.emit("location-update",{
      userId,
      latitude:pos.coords.latitude,
      longitude:pos.coords.longitude
    });

  });

}