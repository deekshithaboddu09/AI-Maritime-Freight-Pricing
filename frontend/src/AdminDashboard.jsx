import { useMemo, useState } from "react";
import "./App.css";

const STATUS_KEY = "maritimeShipmentStatuses";

function shipmentKey(item) {
  return [item.origin, item.destination, item.cargoType, item.containers]
    .map(value => String(value ?? "").trim().toLowerCase())
    .join("|");
}

function readStatuses() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getStatus(item, statuses) {
  return statuses[shipmentKey(item)] || "pending";
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows) {
  const headers = ["Request ID", "Origin", "Destination", "Cargo", "Containers", "Route Status", "Approval Status"];
  const escape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers, ...rows.map(row => [
    row.id,
    row.origin,
    row.destination,
    row.cargoType,
    row.containers,
    row.status === "found" ? "Route Found" : "No Route",
    row.approvalStatus
  ])].map(line => line.map(escape).join(",")).join("\n");
  downloadFile("maritime_shipments.csv", csv, "text/csv;charset=utf-8");
}

export default function AdminDashboard({ currentUser, onLogout }) {
  const [section, setSection] = useState("overview");
  const [shipmentFilter, setShipmentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statuses, setStatuses] = useState(readStatuses);

  const users = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("maritimeUsers") || "[]"); }
    catch { return []; }
  }, []);

  const searches = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("recentSearches") || "[]"); }
    catch { return []; }
  }, []);

  const customers = users.filter(u => u.role !== "admin");
  const admins = users.filter(u => u.role === "admin");

  const shipments = useMemo(() => searches.map((item, index) => ({
    ...item,
    id: `SHP-${String(searches.length - index).padStart(4, "0")}`,
    approvalStatus: getStatus(item, statuses)
  })), [searches, statuses]);

  const pendingCount = shipments.filter(s => s.approvalStatus === "pending").length;
  const approvedCount = shipments.filter(s => s.approvalStatus === "approved").length;

  const filteredShipments = shipments.filter(item => {
    const matchesFilter = shipmentFilter === "all" || item.approvalStatus === shipmentFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      item.id, item.origin, item.destination, item.cargoType
    ].some(value => String(value || "").toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const nav = [
    ["overview", "Overview", "⌂"],
    ["customers", "Customers", "♙"],
    ["shipments", "Shipments", "▣"],
    ["routes", "Route Intelligence", "⚓"],
    ["pricing", "Pricing Control", "$"],
    ["analytics", "Analytics", "◔"],
    ["audit", "Audit Logs", "≡"],
    ["system", "System Status", "●"]
  ];

  const title = nav.find(n => n[0] === section)?.[1] || "Overview";

  const changeShipmentStatus = (shipment, nextStatus) => {
    const next = { ...statuses, [shipmentKey(shipment)]: nextStatus };
    setStatuses(next);
    localStorage.setItem(STATUS_KEY, JSON.stringify(next));
    setSelectedShipment({ ...shipment, approvalStatus: nextStatus });
  };

  return (
    <div className="admin-app">
      <header className="admin-navbar">
        <div className="admin-brand">
          <div className="admin-logo">⚓</div>
          <div><h1>MaritimeAI</h1><span>OPERATIONS CONTROL CENTER</span></div>
        </div>
        <div className="admin-header-right">
          <span className="admin-live"><i /> SYSTEM ONLINE</span>
          <div className="admin-account">
            <div className="admin-avatar">{currentUser?.name?.[0]?.toUpperCase() || "A"}</div>
            <div><strong>{currentUser?.name || "Administrator"}</strong><small>ADMIN</small></div>
          </div>
          <button className="admin-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <span className="admin-side-label">CONTROL CENTER</span>
          {nav.map(([id, label, icon]) => (
            <button key={id} className={`admin-nav ${section === id ? "active" : ""}`} onClick={() => setSection(id)}>
              <b>{icon}</b><span>{label}</span>
            </button>
          ))}
          <div className="admin-access"><b>✓</b><div><strong>Restricted Access</strong><small>Administrator workspace</small></div></div>
        </aside>

        <main className="admin-content">
          <div className="admin-heading">
            <div><span>ADMIN / {section.toUpperCase()}</span><h2>{title}</h2><p>Monitor and manage the MaritimeAI platform.</p></div>
            <div className="admin-status-chip"><i /> LIVE OPERATIONS</div>
          </div>

          {section === "overview" && <>
            <div className="admin-stats">
              <Stat icon="♙" label="Customers" value={customers.length} />
              <Stat icon="▣" label="Shipment Requests" value={shipments.length} />
              <Stat icon="◷" label="Pending Approval" value={pendingCount} warning={pendingCount > 0} />
              <Stat icon="✓" label="Approved Shipments" value={approvedCount} online />
            </div>
            <div className="admin-two-col">
              <Panel eyebrow="PLATFORM HEALTH" title="Core Services">
                <Service name="Route Agent" /><Service name="Pricing Agent" /><Service name="Margin Agent" /><Service name="Quotation Service" />
              </Panel>
              <Panel eyebrow="SHIPMENT WORKFLOW" title="Request Lifecycle">
                <div className="admin-flow"><span>Request</span><b>→</b><span>Review</span><b>→</b><span>Approve</span><b>→</b><span>Quotation</span></div>
                <div className="admin-workflow-note">Admins can review shipment requests before approval.</div>
              </Panel>
            </div>
            <Panel eyebrow="CUSTOMER ACTIVITY" title="Recent Shipment Requests">
              <ShipmentTable rows={shipments.slice(0, 6)} onSelect={setSelectedShipment} />
            </Panel>
          </>}

          {section === "customers" && <Panel eyebrow="ACCOUNT MANAGEMENT" title="Customer Directory">
            <div className="admin-mini-stats"><Stat label="Customers" value={customers.length} /><Stat label="Admins" value={admins.length} /><Stat label="Accounts" value={users.length} /></div>
            <Table headers={["Name", "Email", "Role", "Status"]} rows={users.map(u => [u.name || "—", u.email || "—", u.role || "user", "Active"])} />
          </Panel>}

          {section === "shipments" && <>
            <div className="shipment-command-bar">
              <div className="shipment-tabs">
                {[['all', 'All Shipments', shipments.length], ['pending', 'Pending', pendingCount], ['approved', 'Approved', approvedCount]].map(([id, label, count]) => (
                  <button key={id} className={shipmentFilter === id ? "active" : ""} onClick={() => setShipmentFilter(id)}>
                    {label}<span>{count}</span>
                  </button>
                ))}
              </div>
              <div className="shipment-tools">
                <div className="admin-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipment..." /></div>
                <button className="download-btn" onClick={() => downloadCSV(filteredShipments)}>↓ Download CSV</button>
              </div>
            </div>
            <Panel eyebrow="SHIPMENT OPERATIONS" title={`${shipmentFilter === "all" ? "All" : shipmentFilter === "pending" ? "Pending" : "Approved"} Shipments`}>
              <ShipmentTable rows={filteredShipments} detailed onSelect={setSelectedShipment} />
            </Panel>
          </>}

          {section === "routes" && <FeatureGrid cards={[
            ["Route Engine", "ONLINE", "AI route matching and vessel recommendation."],
            ["Route Dataset", "900+", "Available route records used by the route workflow."],
            ["Best Match", "ACTIVE", "Best suitable route is selected from matching results."],
            ["Alternatives", "ENABLED", "Alternative routes are returned for comparison."]
          ]} />}

          {section === "pricing" && <>
            <FeatureGrid cards={[
              ["Pricing Agent", "ONLINE", "Fuel, port, risk and demand pricing components."],
              ["Freight Engine", "ONLINE", "Combines pricing inputs into operating cost."],
              ["Margin Agent", "10–20%", "Evaluates multiple margin options."],
              ["Quotation Service", "ACTIVE", "Produces the final customer quotation."]
            ]} />
            <Panel eyebrow="BROKERAGE PRICING" title="Pricing Decision Flow"><div className="admin-pricing-flow"><span>Base Freight</span><b>+</b><span>Fuel</span><b>+</b><span>Port</span><b>+</b><span>Risk</span><b>×</b><span>Demand</span><b>→</b><strong>Margin → Customer Price</strong></div></Panel>
          </>}

          {section === "analytics" && <>
            <div className="admin-stats three"><Stat icon="♙" label="Customer Accounts" value={customers.length} /><Stat icon="▣" label="Shipment Searches" value={shipments.length} /><Stat icon="✓" label="Approved Requests" value={approvedCount} online /></div>
            <Panel eyebrow="PLATFORM ACTIVITY" title="Operational Metrics"><Metric label="Customer Accounts" value={customers.length} max={Math.max(customers.length, 10)} /><Metric label="Shipment Requests" value={shipments.length} max={Math.max(shipments.length, 10)} /><Metric label="Approved Requests" value={approvedCount} max={Math.max(shipments.length, 10)} /></Panel>
          </>}

          {section === "audit" && <Panel eyebrow="SYSTEM RECORD" title="Audit Logs"><div className="admin-audit"><Log text="Administrator workspace accessed" /><Log text="Shipment approval queue loaded" /><Log text="Customer data loaded" /><Log text="Route and pricing services verified" /></div></Panel>}

          {section === "system" && <Panel eyebrow="SERVICE HEALTH" title="System Status"><div className="admin-system-grid"><System name="React Frontend"/><System name="FastAPI Backend"/><System name="RouteAgent"/><System name="PricingAgent"/><System name="MarginAgent"/><System name="QuotationService"/><System name="WeatherAgent"/><System name="CustomsAgent"/><System name="Customs Validation"/><System name="RiskService"/></div></Panel>}
        </main>
      </div>

      {selectedShipment && (
        <div className="shipment-modal-backdrop" onClick={() => setSelectedShipment(null)}>
          <aside className="shipment-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div><span>SHIPMENT REQUEST</span><h3>{selectedShipment.id}</h3></div>
              <button onClick={() => setSelectedShipment(null)}>×</button>
            </div>
            <div className="drawer-status-row"><StatusBadge status={selectedShipment.approvalStatus} /><span>{selectedShipment.status === "found" ? "Route Found" : "No Route"}</span></div>
            <div className="drawer-route"><strong>{selectedShipment.origin}</strong><span>→</span><strong>{selectedShipment.destination}</strong></div>
            <div className="drawer-grid">
              <Detail label="Cargo" value={selectedShipment.cargoType} />
              <Detail label="Containers" value={selectedShipment.containers} />
              <Detail label="Route Status" value={selectedShipment.status === "found" ? "Route Found" : "No Route"} />
              <Detail label="Request ID" value={selectedShipment.id} />
            </div>
            <div className="drawer-actions">
              <button className="approve-btn" onClick={() => changeShipmentStatus(selectedShipment, "approved")}>✓ Approve</button>
              <button className="pending-btn" onClick={() => changeShipmentStatus(selectedShipment, "pending")}>↺ Mark Pending</button>
              <button className="download-btn full" onClick={() => downloadFile(`${selectedShipment.id}.json`, JSON.stringify(selectedShipment, null, 2), "application/json")}>↓ Download Details</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ icon="●", label, value, online, warning }) { return <div className="admin-stat"><b>{icon}</b><div><span>{label}</span><strong className={online ? "online" : warning ? "warning" : ""}>{value}</strong></div></div>; }
function Panel({ eyebrow, title, children }) { return <section className="admin-panel"><header><span>{eyebrow}</span><h3>{title}</h3></header>{children}</section>; }
function Service({ name }) { return <div className="admin-service"><span>{name}</span><b><i />Operational</b></div>; }
function StatusBadge({ status }) { return <em className={`shipment-status ${status}`}>{status === "approved" ? "Approved" : "Pending"}</em>; }
function ShipmentTable({ rows, detailed, onSelect }) { return <div className="admin-table-wrap"><table className="admin-table shipment-table"><thead><tr><th>Request ID</th><th>Route</th><th>Cargo</th><th>Containers</th><th>Approval</th><th>Action</th></tr></thead><tbody>{rows.length ? rows.map((r,i)=><tr key={`${r.id}-${i}`}><td><strong className="request-id">{r.id}</strong></td><td className="route-cell">{r.origin} <span>→</span> {r.destination}</td><td>{r.cargoType || "—"}</td><td>{r.containers || "—"}</td><td><StatusBadge status={r.approvalStatus}/></td><td><button className="view-btn" onClick={() => onSelect?.(r)}>View details →</button></td></tr>) : <tr><td colSpan={6} className="empty">No shipment requests found.</td></tr>}</tbody></table></div>; }
function Table({ headers, rows }) { return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{j === r.length-1 && v === "Active" ? <em className="active-text">● Active</em> : v}</td>)}</tr>) : <tr><td colSpan={headers.length} className="empty">No records available.</td></tr>}</tbody></table></div>; }
function FeatureGrid({ cards }) { return <div className="admin-feature-grid">{cards.map(([t,v,d])=><div className="admin-feature" key={t}><div><span>{t}</span><b>{v}</b></div><p>{d}</p></div>)}</div>; }
function Metric({ label, value, max }) { return <div className="admin-metric"><div><span>{label}</span><b>{value}</b></div><div className="metric-track"><i style={{width:`${Math.max(8,Math.min(100,(value/max)*100))}%`}} /></div></div>; }
function Log({ text }) { return <div className="admin-log"><i /> <div><strong>{text}</strong><span>Current session</span></div></div>; }
function System({ name }) { return <div className="admin-system"><span><i />{name}</span><b>Operational</b></div>; }
function Detail({ label, value }) { return <div className="drawer-detail"><span>{label}</span><strong>{value || "—"}</strong></div>; }
