import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  assetId: "",
  reportedBy: "",
  faultDescription: "",
  reportedDate: new Date().toISOString().slice(0, 10),
  priority: "Medium",
  status: "Open",
};

export default function FaultReports({ user, onDataChange }) {
  const [reports, setReports] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    ...emptyForm,
    reportedBy: user.name || "",
  });
  const [saving, setSaving] = useState(false);

  const canManage = user.role !== "Teacher";

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [reportResponse, assetResponse] = await Promise.all([
        api.get("/fault-reports"),
        api.get("/assets"),
      ]);

      setReports(Array.isArray(reportResponse.data) ? reportResponse.data : []);

      setAssets(Array.isArray(assetResponse.data) ? assetResponse.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fault reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      reportedBy: user.name || "",
      reportedDate: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (report) => {
    setEditing(report);

    setForm({
      assetId: report.assetId?._id || report.assetId || "",
      reportedBy: report.reportedBy || "",
      faultDescription: report.faultDescription || "",
      reportedDate: report.reportedDate
        ? String(report.reportedDate).slice(0, 10)
        : "",
      priority: report.priority || "Medium",
      status: report.status || "Open",
    });

    setError("");
    setShowForm(true);
  };

  const saveReport = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await api.put(`/fault-reports/${editing._id}`, form);
      } else {
        await api.post("/fault-reports", form);
      }

      setShowForm(false);
      setEditing(null);

      await loadData();
      await onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save fault report.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this fault report?")) return;

    setError("");

    try {
      await api.delete(`/fault-reports/${id}`);
      await loadData();
      await onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete fault report.");
    }
  };

  const getAssetName = (report) => {
    const assetId = report.assetId?._id || report.assetId;

    return (
      report.assetId?.assetName ||
      assets.find((asset) => asset._id === assetId)?.assetName ||
      "Unknown asset"
    );
  };

  return (
    <section className="dashboard-content">
      <div className="welcome-section">
        <div>
          <h2>Fault Report Management</h2>
          <p>Record faults, assign their priority and track resolution.</p>
        </div>

        {canManage && (
          <button className="login-button" onClick={openNewForm}>
            + Report Fault
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && canManage && (
        <form className="panel asset-form" onSubmit={saveReport}>
          <h3>{editing ? "Edit Fault Report" : "Report a Fault"}</h3>

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

          <label>Reported By</label>
          <input
            required
            value={form.reportedBy}
            onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
          />

          <label>Fault Description</label>
          <textarea
            required
            rows="3"
            value={form.faultDescription}
            onChange={(e) =>
              setForm({ ...form, faultDescription: e.target.value })
            }
          />

          <label>Reported Date</label>
          <input
            required
            type="date"
            value={form.reportedDate}
            onChange={(e) => setForm({ ...form, reportedDate: e.target.value })}
          />

          <label>Priority</label>
          <select
            required
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Open</option>
            <option>Under Investigation</option>
            <option>Resolved</option>
          </select>

          <button className="login-button" disabled={saving}>
            {saving ? "Saving..." : "Save Fault Report"}
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
        <h3>Registered Fault Reports</h3>

        {loading ? (
          <p className="empty-state">Loading fault reports...</p>
        ) : reports.length === 0 ? (
          <p className="empty-state">No fault reports found.</p>
        ) : (
          <div className="table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Reported By</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{getAssetName(report)}</td>
                    <td>{report.reportedBy}</td>
                    <td>{report.faultDescription}</td>
                    <td>{String(report.reportedDate || "").slice(0, 10)}</td>
                    <td>
                      <span className="role-badge">
                        {report.priority || "Medium"}
                      </span>
                    </td>
                    <td>
                      <span className="role-badge">{report.status}</span>
                    </td>

                    {canManage && (
                      <td>
                        <button
                          className="table-action"
                          onClick={() => openEditForm(report)}
                        >
                          Edit
                        </button>

                        {user.role === "Admin" && (
                          <button
                            className="table-action danger-action"
                            onClick={() => deleteReport(report._id)}
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
