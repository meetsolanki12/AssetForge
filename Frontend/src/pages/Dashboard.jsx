import {
  Monitor,
  Building2,
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function Dashboard({ user, stats, error }) {
  const statCards = [
    { label: "Total Assets", value: stats?.totalAssets ?? "—", icon: Monitor },
    {
      label: "Working Assets",
      value: stats?.workingAssets ?? "—",
      icon: CheckCircle,
    },
    {
      label: "Faulty Assets",
      value: stats?.faultyAssets ?? "—",
      icon: AlertTriangle,
    },
    { label: "Laboratories", value: stats?.totalLabs ?? "—", icon: Building2 },
    {
      label: "Open Faults",
      value: stats?.openFaults ?? "—",
      icon: ClipboardList,
    },
    {
      label: "Pending Maintenance",
      value: stats?.pendingMaintenance ?? "—",
      icon: Wrench,
    },
  ];

  return (
    <section className="dashboard-content">
      <div className="welcome-section">
        <div>
          <h2>Welcome back, {user.name}</h2>
          <p>Here is your laboratory system overview.</p>
        </div>
        <span className="role-badge">{user.role}</span>
      </div>

      {error && <div className="error-message dashboard-error">{error}</div>}

      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="stat-card" key={card.label}>
              <div className="stat-card-top">
                <span>{card.label}</span>
                <Icon size={21} />
              </div>
              <h3>{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="dashboard-panels">
        <section className="panel">
          <div className="panel-heading">
            <h3>Asset Status Overview</h3>
          </div>

          {stats ? (
            <div className="status-list">
              <div>
                <span>
                  <CheckCircle size={17} /> Working
                </span>
                <strong>{stats.workingAssets}</strong>
              </div>
              <div>
                <span>
                  <AlertTriangle size={17} /> Faulty
                </span>
                <strong>{stats.faultyAssets}</strong>
              </div>
              <div>
                <span>
                  <Wrench size={17} /> Under Maintenance
                </span>
                <strong>{stats.maintenanceAssets}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">
              {error || "Loading asset information..."}
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h3>System Overview</h3>
          </div>

          <div className="overview-item">
            <Building2 size={19} />
            <span>Total Laboratories</span>
            <strong>{stats?.totalLabs ?? "—"}</strong>
          </div>

          <div className="overview-item">
            <ClipboardList size={19} />
            <span>Unresolved Faults</span>
            <strong>{stats?.openFaults ?? "—"}</strong>
          </div>

          <div className="overview-item">
            <Wrench size={19} />
            <span>Pending Maintenance</span>
            <strong>{stats?.pendingMaintenance ?? "—"}</strong>
          </div>
        </section>
      </div>
    </section>
  );
}
