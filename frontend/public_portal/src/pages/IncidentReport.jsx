import React, { useState } from "react";

export default function IncidentReport() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${backendUrl}/api/zones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          latitude: 30.7333, // TODO: Use user's current location
          longitude: 76.7794,
          riskLevel,
          type: "incident"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to report incident");
        setSuccess("");
      } else {
        setSuccess("Incident reported successfully!");
        setError("");
        setTitle("");
        setDescription("");
      }
    } catch (err) {
      setError("Network error");
      setSuccess("");
    }
  };

  return (
    <div className="auth-container">
      <h2>Report Incident</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          style={{ minHeight: "80px" }}
        />
        <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Report</button>
        {error && <div style={{color:'red'}}>{error}</div>}
        {success && <div style={{color:'green'}}>{success}</div>}
      </form>
    </div>
  );
}
