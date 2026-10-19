import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  assetId: "",
  faultId: "",
  technician: "",
  maintenanceDate: new Date().toISOString().slice(0, 10),
  description: "",
  status: "Pending",
};

export default function Maintenance({ user, onDataChange }) {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [maintenanceResponse, assetResponse, faultResponse] =
        await Promise.all([
          api.get("/maintenance"),
          api.get("/assets"),
          api.get("/fault-reports"),
        ]);

      setRecords(
        Array.isArray(maintenanceResponse.data) ? maintenanceResponse.data : [],
      );
      setAssets(Array.isArray(assetResponse.data) ? assetResponse.data : []);
      setFaults(Array.isArray(faultResponse.data) ? faultResponse.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load maintenance records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditing(record);
    setForm({
      assetId: record.assetId?._id || record.assetId || "",
      faultId: record.faultId?._id || record.faultId || "",
      technician: record.technician || "",
      maintenanceDate: record.maintenanceDate
        ? String(record.maintenanceDate).slice(0, 10)
        : "",
      description: record.description || "",
      status: record.status || "Pending",
    });
    setError("");
    setShowForm(true);
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const data = {
      ...form,
      faultId: form.faultId || null,
    };

    try {
      if (editing) {
        await api.put(`/maintenance/${editing._id}`, data);
      } else {
        await api.post("/maintenance", data);
      }

      setShowForm(false);
      setEditing(null);
      await loadData();
      await onDataChange();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save maintenance record.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Delete this maintenance record?")) return;

    setError("");

    try {
      await api.delete(`/maintenance/${id}`);
      await loadData();
      await onDataChange();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete maintenance record.",
      );
    }
  };

  const canManage = user.role !== "Teacher";

  const getAssetName = (record) => {
    const id = record.assetId?._id || record.assetId;
    return (
      record.assetId?.assetName ||
      assets.find((asset) => asset._id === id)?.assetName ||
      "Unknown asset"
    );
  };

  const getFaultDescription = (record) => {
    const id = record.faultId?._id || record.faultId;
    return (
      record.faultId?.faultDescription ||
      faults.find((fault) => fault._id === id)?.faultDescription ||
      "—"
    );
  };

  return (
    <section className="dashboard-content">
      <div className="welcome-section">
        <div>
          <h2>Maintenance Management</h2>
          <p>Track workstation repairs and maintenance progress.</p>
        </div>

        {canManage && (
          <button className="login-button" onClick={openNewForm}>
            + Add Maintenance
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="panel asset-form" onSubmit={saveRecord}>
          <h3>{editing ? "Edit Maintenance" : "Add Maintenance"}</h3>

          <label>Workstation / Asset</label>
          <select
            required
            value={form.assetId}
            onChange={(e) => setForm({ ...form, assetId: e.target.value })}
          >
            <option value="">Select asset</option>
            {assets.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.assetName} — {asset.workstationNo}
              </option>
            ))}
          </select>

          <label>Related Fault Report</label>
          <select
            value={form.faultId}
            onChange={(e) => setForm({ ...form, faultId: e.target.value })}
          >
            <option value="">No linked fault</option>
            {faults.map((fault) => (
              <option key={fault._id} value={fault._id}>
                {fault.faultDescription}
              </option>
            ))}
          </select>

          <label>Technician</label>
          <input
            required
            value={form.technician}
            onChange={(e) => setForm({ ...form, technician: e.target.value })}
          />

          <label>Maintenance Date</label>
          <input
            required
            type="date"
            value={form.maintenanceDate}
            onChange={(e) =>
              setForm({ ...form, maintenanceDate: e.target.value })
            }
          />

          <label>Description / Work Performed</label>
          <textarea
            required
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

          <button className="login-button" disabled={saving}>
            {saving ? "Saving..." : "Save Maintenance"}
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
        <h3>Maintenance Records</h3>

        {loading ? (
          <p className="empty-state">Loading maintenance records...</p>
        ) : records.length === 0 ? (
          <p className="empty-state">No maintenance records found.</p>
        ) : (
          <div className="table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Related Fault</th>
                  <th>Technician</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{getAssetName(record)}</td>
                    <td>{getFaultDescription(record)}</td>
                    <td>{record.technician}</td>
                    <td>{String(record.maintenanceDate || "").slice(0, 10)}</td>
                    <td>{record.description}</td>
                    <td>
                      <span className="role-badge">{record.status}</span>
                    </td>
                    {canManage && (
                      <td>
                        <button
                          className="table-action"
                          onClick={() => openEditForm(record)}
                        >
                          Edit
                        </button>

                        {user.role === "Admin" && (
                          <button
                            className="table-action danger-action"
                            onClick={() => deleteRecord(record._id)}
                          >
                            Delete
                          </button>
                        )}
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
