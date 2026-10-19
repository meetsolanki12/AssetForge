import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  labName: "",
  labCode: "",
  location: "",
  capacity: "",
  status: "Active",
};

export default function Laboratories({ user, onDataChange }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const isAdmin = user.role === "Admin";

  const loadLabs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/laboratories");
      setLabs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load laboratories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (lab) => {
    setEditing(lab);
    setForm({
      labName: lab.labName || "",
      labCode: lab.labCode || "",
      location: lab.location || "",
      capacity: String(lab.capacity ?? ""),
      status: lab.status || "Active",
    });
    setError("");
    setShowForm(true);
  };

  const saveLab = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const data = {
      ...form,
      labName: form.labName.trim(),
      labCode: form.labCode.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
    };

    try {
      if (editing) {
        await api.put(`/laboratories/${editing._id}`, data);
      } else {
        await api.post("/laboratories", data);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm });

      await loadLabs();
      await onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save laboratory.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLab = async (id) => {
    if (
      !window.confirm(
        "Delete this laboratory? Make sure no assets depend on it.",
      )
    ) {
      return;
    }

    setError("");

    try {
      await api.delete(`/laboratories/${id}`);
      await loadLabs();
      await onDataChange();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete laboratory. It may still have assigned assets.",
      );
    }
  };

  return (
    <section className="dashboard-content">
      <div className="welcome-section">
        <div>
          <h2>Laboratory Management</h2>
          <p>Manage computer laboratories and their details.</p>
        </div>

        {isAdmin && (
          <button className="login-button" onClick={openNewForm}>
            + Add Laboratory
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && isAdmin && (
        <form className="panel asset-form" onSubmit={saveLab}>
          <h3>{editing ? "Edit Laboratory" : "Add Laboratory"}</h3>

          <label>Laboratory Name</label>
          <input
            required
            value={form.labName}
            onChange={(e) => setForm({ ...form, labName: e.target.value })}
          />

          <label>Laboratory Code</label>
          <input
            required
            value={form.labCode}
            onChange={(e) => setForm({ ...form, labCode: e.target.value })}
          />

          <label>Location</label>
          <input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <label>Capacity</label>
          <input
            required
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />

          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button className="login-button" disabled={saving}>
            {saving
              ? "Saving..."
              : editing
                ? "Save Changes"
                : "Create Laboratory"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <div className="panel asset-table-panel">
        <h3>Registered Laboratories ({labs.length})</h3>

        {loading ? (
          <p className="empty-state">Loading laboratories...</p>
        ) : labs.length === 0 ? (
          <p className="empty-state">No laboratories found.</p>
        ) : (
          <div className="table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {labs.map((lab) => (
                  <tr key={lab._id}>
                    <td>{lab.labName}</td>
                    <td>{lab.labCode}</td>
                    <td>{lab.location}</td>
                    <td>{lab.capacity}</td>
                    <td>
                      <span className="role-badge">{lab.status}</span>
                    </td>

                    {isAdmin && (
                      <td>
                        <button
                          className="table-action"
                          onClick={() => openEditForm(lab)}
                        >
                          Edit
                        </button>

                        <button
                          className="table-action danger-action"
                          onClick={() => deleteLab(lab._id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
