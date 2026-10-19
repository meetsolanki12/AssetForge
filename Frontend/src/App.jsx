import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  Building2,
  Wrench,
  AlertTriangle,
  Users as UsersIcon,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Laboratories from "./pages/Laboratories";
import FaultReports from "./pages/FaultReports";
import Maintenance from "./pages/Maintenance";
import Users from "./pages/Users";
import api from "./services/api";
import "./App.css";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Assets", icon: Monitor },
  { label: "Laboratories", icon: Building2 },
  { label: "Fault Reports", icon: AlertTriangle },
  { label: "Maintenance", icon: Wrench },
  { label: "Users", icon: UsersIcon, adminOnly: true },
];

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("assetforgeToken") || "",
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("assetforgeUser") || "null");
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("Dashboard");
  const [stats, setStats] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  const logout = () => {
    localStorage.removeItem("assetforgeToken");
    localStorage.removeItem("assetforgeUser");
    setToken("");
    setUser(null);
    setStats(null);
    setDashboardError("");
    setPage("Dashboard");
  };

  const handleLogin = (receivedToken, receivedUser) => {
    setToken(receivedToken);
    setUser(receivedUser);
    setPage("Dashboard");
  };

  const refreshDashboard = async () => {
    try {
      setDashboardError("");
      const response = await api.get("/dashboard");
      setStats(response.data.stats);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }

      setDashboardError(
        err.response?.data?.message || "Unable to load dashboard data.",
      );
    }
  };

  useEffect(() => {
    if (token && user) {
      refreshDashboard();
    }
  }, [token, user]);

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || user.role === "Admin",
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Monitor size={23} />
          </div>
          <div>
            <h2>AssetForge</h2>
            <span>LAB MANAGEMENT</span>
          </div>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${page === item.label ? "active" : ""}`}
                onClick={() => setPage(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-summary">
            <div className="user-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="user-details">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{page}</h1>
            <p>Computer Lab Workstation &amp; Maintenance Management</p>
          </div>

          <div className="topbar-user">
            <ShieldCheck size={19} />
            <span>{user.role}</span>
          </div>
        </header>

        {page === "Dashboard" && (
          <Dashboard user={user} stats={stats} error={dashboardError} />
        )}

        {page === "Assets" && (
          <Assets user={user} onDataChange={refreshDashboard} />
        )}

        {page === "Laboratories" && (
          <Laboratories user={user} onDataChange={refreshDashboard} />
        )}

        {page === "Fault Reports" && (
          <FaultReports user={user} onDataChange={refreshDashboard} />
        )}

        {page === "Maintenance" && (
          <Maintenance user={user} onDataChange={refreshDashboard} />
        )}

        {page === "Users" && <Users user={user} />}
      </main>
    </div>
  );
}
