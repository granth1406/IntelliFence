import React, { useEffect, useState } from "react";

export default function IncidentsPanel() {
  const [incidents, setIncidents] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${backendUrl}/api/zones/incidents`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIncidents(data);
        } else {
          setFetchError("Failed to load incidents");
        }
      })
      .catch(() => setFetchError("Network error"));
  }, [backendUrl, token]);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Incidents</h2>
      {fetchError && <div style={{ color: "red" }}>{fetchError}</div>}
      <ul>
        {incidents.map(inc => (
          <li key={inc._id} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 8 }}>
            <strong>{inc.title}</strong> <br />
            {inc.description} <br />
            Risk: {inc.riskLevel} <br />
            Status: {inc.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
