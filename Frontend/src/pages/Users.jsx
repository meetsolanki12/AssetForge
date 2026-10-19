import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "Teacher",
};

export default function Users({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (selectedUser) => {
    setEditing(selectedUser);
    setForm({
      name: selectedUser.name || "",
      email: selectedUser.email || "",
      password: "",
      role: selectedUser.role || "Teacher",
    });
    setError("");
    setShowForm(true);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const data = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    };

    if (form.password) {
      data.password = form.password;
    }

    try {
      if (editing) {
        await api.put(`/users/${editing._id}`, data);
      } else {
        if (!form.password) {
          setError("A password is required when creating a user.");
          setSaving(false);
          return;
        }

        await api.post("/users", data);
      }

      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (selectedUser) => {
    if (selectedUser._id === user.id) {
      setError("You cannot delete your own account while signed in.");
      return;
    }

    if (!window.confirm(`Delete user ${selectedUser.name}?`)) return;

    setError("");

    try {
      await api.delete(`/users/${selectedUser._id}`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  if (user.role !== "Admin") {
    return (
      <section className="placeholder-panel">
        <h2>Access Denied</h2>
        <p>Only an Admin can manage users.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-content">
      <div className="welcome-section">
        <div>
          <h2>User Management</h2>
          <p>Manage system accounts and their assigned roles.</p>
        </div>

        <button className="login-button" onClick={openNewForm}>
          + Add User
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="panel asset-form" onSubmit={saveUser}>
          <h3>{editing ? "Edit User" : "Add User"}</h3>

          <label>Full Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label>Email Address</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label>{editing ? "New Password (optional)" : "Password"}</label>
          <input
            type="password"
            required={!editing}
            minLength={8}
            autoComplete="new-password"
            placeholder={
              editing
                ? "Leave blank to keep current password"
                : "At least 8 characters"
            }
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="Admin">Admin</option>
            <option value="Lab Assistant">Lab Assistant</option>
            <option value="Teacher">Teacher</option>
          </select>

          <button className="login-button" disabled={saving}>
            {saving ? "Saving..." : "Save User"}
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
        <h3>Registered Users</h3>

        {loading ? (
          <p className="empty-state">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <div className="table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>
                      <span className="role-badge">{item.role}</span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => openEditForm(item)}
                      >
                        Edit
                      </button>

                      <button
                        className="table-action danger-action"
                        onClick={() => deleteUser(item)}
                      >
                        Delete
                      </button>
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
