function isPointInsideZone(point, polygon) {

  const x = point.latitude;
  const y = point.longitude;

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {

    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;

    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;

  }

  return inside;
};


function distanceBetweenPoints(lat1, lon1, lat2, lon2) {

  const R = 6371e3;

  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;

  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = {isPointInsideZone, distanceBetweenPoints}