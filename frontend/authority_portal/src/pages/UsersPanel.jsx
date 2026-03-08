import React, { useEffect, useState } from "react";

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${backendUrl}/users`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setFetchError("Failed to load users");
        }
      })
      .catch(() => setFetchError("Network error"));
  }, [backendUrl, token]);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>All Users</h2>
      {fetchError && <div style={{ color: "red" }}>{fetchError}</div>}
      <ul>
        {users.map(user => (
          <li key={user._id} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 8 }}>
            <strong>{user.name}</strong> <br />
            Email: {user.email} <br />
            Role: {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
