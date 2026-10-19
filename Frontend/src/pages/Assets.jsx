import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  assetName: "",
  assetType: "",
  workstationNo: "",
  status: "Working",
  labId: "",
  purchaseDate: "",
};

const getId = (value) =>
  value && typeof value === "object" ? value._id : value;

export default function Assets({ user, onDataChange }) {
  const [assets, setAssets] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [labFilter, setLabFilter] = useState("All");
  const [statusChanges, setStatusChanges] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState("");

  // Asset history state
  const [historyAsset, setHistoryAsset] = useState(null);
  const [historyFaults, setHistoryFaults] = useState([]);
  const [historyMaintenance, setHistoryMaintenance] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const isAdmin = user.role === "Admin";
  const canUpdateStatus =
    user.role === "Admin" || user.role === "Lab Assistant";

  const loadAssets = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/assets");
      const list = Array.isArray(response.data) ? response.data : [];

      setAssets(list);
      setStatusChanges(
        Object.fromEntries(list.map((asset) => [asset._id, asset.status])),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assets.");
    } finally {
      setLoading(false);
    }
  };

  const loadLabs = async () => {
    try {
      const response = await api.get("/laboratories");
      setLabs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load laboratories.");
    }
  };

  useEffect(() => {
    loadAssets();
    loadLabs();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
    loadLabs();
  };

  const openEditForm = (asset) => {
    setEditing(asset);

    setForm({
      assetName: asset.assetName || "",
      assetType: asset.assetType || "",
      workstationNo: asset.workstationNo || "",
      status: asset.status || "Working",
      labId: asset.labId?._id || asset.labId || "",
      purchaseDate: asset.purchaseDate
        ? String(asset.purchaseDate).slice(0, 10)
        : "",
    });

    setError("");
    setShowForm(true);
    loadLabs();
  };

  const saveAsset = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await api.put(`/assets/${editing._id}`, form);
      } else {
        await api.post("/assets", form);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm });

      await loadAssets();
      await onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save asset.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (asset) => {
    const newStatus = statusChanges[asset._id];

    if (!newStatus || newStatus === asset.status) return;

    setUpdatingStatus(asset._id);
    setError("");

    try {
      await api.patch(`/assets/${asset._id}/status`, {
        status: newStatus,
      });

      await loadAssets();
      await onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update asset status.");

      setStatusChanges((current) => ({
        ...current,
        [asset._id]: asset.status,
      }));
    } finally {
      setUpdatingStatus("");
    }
  };

  const deleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;

    setError("");

    try {
      await api.delete(`/assets/${id}`);
      if (historyAsset?._id === id) closeHistory();

      await loadAssets();
      await onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete asset.");
    }
  };

  // Load fault and maintenance records belonging to one asset
  const openHistory = async (asset) => {
    setHistoryAsset(asset);
    setHistoryFaults([]);
    setHistoryMaintenance([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const [faultResponse, maintenanceResponse] = await Promise.all([
        api.get("/fault-reports"),
        api.get("/maintenance"),
      ]);

      const faults = Array.isArray(faultResponse.data)
        ? faultResponse.data
        : [];

      const maintenance = Array.isArray(maintenanceResponse.data)
        ? maintenanceResponse.data
        : [];

      setHistoryFaults(
        faults.filter(
          (fault) => String(getId(fault.assetId)) === String(asset._id),
        ),
      );

      setHistoryMaintenance(
        maintenance.filter(
          (record) => String(getId(record.assetId)) === String(asset._id),
        ),
      );
    } catch (err) {
      setHistoryError(
        err.response?.data?.message || "Failed to load this asset's history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryAsset(null);
    setHistoryFaults([]);
    setHistoryMaintenance([]);
    setHistoryError("");
  };

  const getLabId = (asset) => getId(asset.labId) || "";

  const getLabName = (asset) =>
    asset.labId?.labName ||
    labs.find((lab) => lab._id === getLabId(asset))?.labName ||
    "—";

  const filteredAssets = assets.filter((asset) => {
    const text = search.trim().toLowerCase();

    const matchesSearch =
      !text ||
      [
        asset.assetName,
        asset.assetType,
        asset.workstationNo,
        getLabName(asset),
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(text),
      );

    const matchesStatus =
      statusFilter === "All" || asset.status === statusFilter;

    const matchesLab = labFilter === "All" || getLabId(asset) === labFilter;

    return matchesSearch && matchesStatus && matchesLab;
  });

  return (
    <section className="dashboard-content">
      <div className="welcome-section">
        <div>
          <h2>Asset Management</h2>
          <p>Manage and monitor computer lab workstations and equipment.</p>
        </div>

        {isAdmin && (
          <button className="login-button" onClick={openNewForm}>
            + Add Asset
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* Search and filters */}
      <div className="panel asset-filters">
        <input
          aria-label="Search assets"
          placeholder="Search name, type, workstation or laboratory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Working">Working</option>
          <option value="Faulty">Faulty</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </select>

        <select
          aria-label="Filter by laboratory"
          value={labFilter}
          onChange={(e) => setLabFilter(e.target.value)}
        >
          <option value="All">All laboratories</option>
          {labs.map((lab) => (
            <option key={lab._id} value={lab._id}>
              {lab.labName}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setSearch("");
            setStatusFilter("All");
            setLabFilter("All");
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Add or edit asset */}
      {showForm && isAdmin && (
        <form className="panel asset-form" onSubmit={saveAsset}>
          <h3>{editing ? "Edit Asset" : "Add Asset"}</h3>

          <label>Asset Name</label>
          <input
            required
            value={form.assetName}
            onChange={(e) => setForm({ ...form, assetName: e.target.value })}
          />

          <label>Asset Type</label>
          <input
            required
            value={form.assetType}
            onChange={(e) => setForm({ ...form, assetType: e.target.value })}
          />

          <label>Workstation Number</label>
          <input
            required
            value={form.workstationNo}
            onChange={(e) =>
              setForm({ ...form, workstationNo: e.target.value })
            }
          />

          <label>Laboratory</label>
          <select
            required
            value={form.labId}
            onChange={(e) => setForm({ ...form, labId: e.target.value })}
          >
            <option value="">Select laboratory</option>
            {labs.map((lab) => (
              <option key={lab._id} value={lab._id}>
                {lab.labName} ({lab.labCode})
              </option>
            ))}
          </select>

          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Working</option>
            <option>Faulty</option>
            <option>Under Maintenance</option>
          </select>

          <label>Purchase Date</label>
          <input
            type="date"
            required
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />

          <button className="login-button" disabled={saving}>
            {saving ? "Saving..." : "Save Asset"}
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

      {/* Asset history */}
      {historyAsset && (
        <section className="panel asset-table-panel">
          <div className="welcome-section">
            <div>
              <h3>Asset History: {historyAsset.assetName}</h3>
              <p>
                Workstation {historyAsset.workstationNo} ·{" "}
                {getLabName(historyAsset)}
              </p>
            </div>

            <button className="secondary-button" onClick={closeHistory}>
              Close History
            </button>
          </div>

          {historyError && <p className="error-message">{historyError}</p>}

          {historyLoading ? (
            <p className="empty-state">Loading asset history...</p>
          ) : (
            <>
              <h3>Fault History ({historyFaults.length})</h3>

              {historyFaults.length === 0 ? (
                <p className="empty-state">
                  No fault reports recorded for this asset.
                </p>
              ) : (
                <div className="table-scroll">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Reported By</th>
                        <th>Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyFaults.map((fault) => (
                        <tr key={fault._id}>
                          <td>{fault.faultDescription}</td>
                          <td>{fault.reportedBy}</td>
                          <td>
                            {String(fault.reportedDate || "").slice(0, 10)}
                          </td>
                          <td>
                            <span className="role-badge">
                              {fault.priority || "Medium"}
                            </span>
                          </td>
                          <td>
                            <span className="role-badge">{fault.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3>Maintenance History ({historyMaintenance.length})</h3>

              {historyMaintenance.length === 0 ? (
                <p className="empty-state">
                  No maintenance records recorded for this asset.
                </p>
              ) : (
                <div className="table-scroll">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Technician</th>
                        <th>Description</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyMaintenance.map((record) => (
                        <tr key={record._id}>
                          <td>
                            {String(record.maintenanceDate || "").slice(0, 10)}
                          </td>
                          <td>{record.technician}</td>
                          <td>{record.description}</td>
                          <td>
                            <span className="role-badge">{record.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Main asset list */}
      <div className="panel asset-table-panel">
        <h3>Registered Assets ({filteredAssets.length})</h3>

        {loading ? (
          <p className="empty-state">Loading assets...</p>
        ) : filteredAssets.length === 0 ? (
          <p className="empty-state">No assets match your search or filters.</p>
        ) : (
          <div className="table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Workstation</th>
                  <th>Laboratory</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td>{asset.assetName}</td>
                    <td>{asset.assetType}</td>
                    <td>{asset.workstationNo}</td>
                    <td>{getLabName(asset)}</td>

                    <td>
                      {canUpdateStatus ? (
                        <select
                          aria-label={`Status for ${asset.assetName}`}
                          value={statusChanges[asset._id] ?? asset.status}
                          onChange={(e) =>
                            setStatusChanges((current) => ({
                              ...current,
                              [asset._id]: e.target.value,
                            }))
                          }
                        >
                          <option>Working</option>
                          <option>Faulty</option>
                          <option>Under Maintenance</option>
                        </select>
                      ) : (
                        <span className="role-badge">{asset.status}</span>
                      )}
                    </td>

                    <td>
                      <button
                        className="table-action"
                        onClick={() => openHistory(asset)}
                      >
                        History
                      </button>

                      {canUpdateStatus &&
                        statusChanges[asset._id] !== asset.status && (
                          <button
                            className="table-action"
                            disabled={updatingStatus === asset._id}
                            onClick={() => updateStatus(asset)}
                          >
                            {updatingStatus === asset._id
                              ? "Saving..."
                              : "Save Status"}
                          </button>
                        )}

                      {isAdmin && (
                        <>
                          <button
                            className="table-action"
                            onClick={() => openEditForm(asset)}
                          >
                            Edit
                          </button>

                          <button
                            className="table-action danger-action"
                            onClick={() => deleteAsset(asset._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
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
