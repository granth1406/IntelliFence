export default function AdminPanel(){

  const [zones, setZones] = React.useState([]);
  const [fetchError, setFetchError] = React.useState("");
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem("token");

  React.useEffect(() => {
    fetch(`${backendUrl}/api/zones/zones`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setZones(data);
        } else {
          setFetchError("Failed to load zones");
        }
      })
      .catch(() => setFetchError("Network error"));
  }, [backendUrl, token]);

  async function createZone() {
    await fetch(`${backendUrl}/api/zones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Danger Area",
        latitude: 30.7333,
        longitude: 76.7794,
        riskLevel: "high"
      })
    });
    window.location.reload();
  }

  async function editZone(id, updates) {
    await fetch(`${backendUrl}/api/zones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    window.location.reload();
  }

  async function deleteZone(id) {
    await fetch(`${backendUrl}/api/zones/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    window.location.reload();
  }

  async function approveZone(id) {
    await fetch(`${backendUrl}/api/zones/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    window.location.reload();
  }

  async function rejectZone(id) {
    await fetch(`${backendUrl}/api/zones/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    window.location.reload();
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Zone Management</h2>
      {fetchError && <div style={{ color: "red" }}>{fetchError}</div>}
      <button onClick={createZone} style={{ marginBottom: 16 }}>Create Zone</button>
      <ul>
        {zones.map(zone => (
          <li key={zone._id} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 8 }}>
            <strong>{zone.title}</strong> <br />
            Risk: {zone.riskLevel} <br />
            Status: {zone.status} <br />
            <button onClick={() => approveZone(zone._id)} style={{ marginRight: 8 }}>Approve</button>
            <button onClick={() => rejectZone(zone._id)} style={{ marginRight: 8 }}>Reject</button>
            <button onClick={() => deleteZone(zone._id)} style={{ marginRight: 8 }}>Delete</button>
            <button onClick={() => editZone(zone._id, { title: zone.title + " (Edited)" })}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );

}