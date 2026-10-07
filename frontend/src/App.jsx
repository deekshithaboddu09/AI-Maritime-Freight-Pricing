import { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import jsPDF from "jspdf";


const downloadQuotationPDF = (quotation, currentUser) => {
  if (!quotation) return;

  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const navy = [7, 24, 39];
  const navy2 = [8, 39, 58];
  const cyan = [43, 177, 229];
  const green = [42, 190, 139];
  const white = [255, 255, 255];
  const ink = [24, 43, 57];
  const muted = [92, 117, 132];
  const light = [239, 247, 251];
  const line = [205, 221, 229];

  const money = (value) =>
    `$${Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const date = new Date();
  const dateText = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const quotationNumber = `MQ-${date.getFullYear()}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(
    Date.now()
  ).slice(-5)}`;

  const origin = quotation.origin || "N/A";
  const destination = quotation.destination || "N/A";
  const cargo = quotation.cargo_type || "N/A";
  const containers = quotation.containers ?? "N/A";
  const route = quotation.recommended_route || quotation.route_info || {};
  const alternatives = quotation.alternatives || [];

  const section = (title, x, y, width) => {
    doc.setFillColor(...navy2);
    doc.roundedRect(x, y, width, 9, 2, 2, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, x + 5, y + 6.1);
  };

  const labelValue = (label, value, x, y) => {
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.text(label.toUpperCase(), x, y);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.text(String(value), x, y + 6);
  };

  // Header / brand
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 48, "F");
  doc.setFillColor(...cyan);
  doc.roundedRect(14, 8, 17, 17, 4, 4, "F");
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("M", 20.1, 19.5);
  doc.setFontSize(19);
  doc.text("MaritimeAI", 37, 16);
  doc.setTextColor(163, 207, 222);
  doc.setFontSize(7);
  doc.setCharSpace(1.5);
  doc.text("INTELLIGENT SHIPPING", 38, 22);
  doc.setCharSpace(0);
  doc.setTextColor(...white);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Global Routes. Smarter Decisions.", W - 14, 13, { align: "right" });
  doc.setTextColor(...cyan);
  doc.text("Efficient  •  Reliable  •  Sustainable", W - 14, 19, { align: "right" });

  // Title
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text("Freight Quotation", 14, 61);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("AI-Powered Route Optimization & Pricing", 14, 68);

  doc.setFillColor(...navy);
  doc.roundedRect(W - 72, 52, 58, 28, 3, 3, "F");
  doc.setTextColor(170, 215, 230);
  doc.setFontSize(7.5);
  doc.text("QUOTATION NO.", W - 67, 59.5);
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(quotationNumber, W - 67, 66.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Date: ${dateText}`, W - 67, 74);

  // Shipment and customer
  section("Shipment Details", 14, 87, 110);
  section("Customer Information", 128, 87, 68);
  labelValue("Origin", origin, 20, 103);
  labelValue("Destination", destination, 20, 119);
  labelValue("Cargo Type", cargo, 75, 103);
  labelValue("Containers", `${containers} containers`, 75, 119);
  labelValue("Customer Name", currentUser?.name || "Customer", 133, 103);
  labelValue("Email", currentUser?.email || "N/A", 133, 119);

  // Route and pricing
  section("Recommended Route", 14, 137, 110);
  section("Pricing Summary", 128, 137, 68);
  labelValue("Route ID", route.route_id ?? "N/A", 20, 151);
  labelValue("Recommended Vessel", route.recommended_ship ?? "N/A", 20, 166);
  labelValue("Distance", `${route.distance_nm ?? "N/A"} NM`, 75, 151);
  labelValue("Transit Time", `${quotation.transit_time_days ?? route.estimated_days ?? "N/A"} days`, 75, 166);
  labelValue("AI Route Match", `${quotation.route_score ?? quotation.recommendation?.match_percentage ?? "N/A"}%`, 20, 181);

  const priceRows = [
    ["Base Freight", money(quotation.base_freight_usd)],
    ["Fuel Surcharge", money(quotation.fuel_surcharge_usd)],
    ["Port Charges", money(quotation.port_charge_usd)],
    ["Risk Surcharge", money(quotation.risk_surcharge_usd)],
    ["Operating Cost", money(quotation.operating_cost_usd)],
    ["Customer Price", money(quotation.customer_price_usd)],
  ];

  let py = 146;
  priceRows.forEach(([label, value], i) => {
    if (i === priceRows.length - 1) {
      doc.setFillColor(...light);
      doc.rect(128, py - 4, 68, 9, "F");
    }
    doc.setTextColor(...(i === priceRows.length - 1 ? navy : ink));
    doc.setFont("helvetica", i === priceRows.length - 1 ? "bold" : "normal");
    doc.setFontSize(7.4);
    doc.text(label, 132, py + 1);
    doc.text(value, 192, py + 1, { align: "right" });
    if (i !== priceRows.length - 1) {
      doc.setDrawColor(...line);
      doc.line(132, py + 4, 192, py + 4);
    }
    py += 9;
  });

  // Margin analysis
  doc.setFillColor(...light);
  doc.roundedRect(14, 197, 182, 27, 3, 3, "F");
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AI Pricing & Margin Analysis", 20, 206);
  labelValue("Target Margin", `${quotation.target_margin_percent ?? "N/A"}%`, 20, 211);
  labelValue("Actual Margin", `${quotation.actual_margin_percent ?? "N/A"}%`, 72, 211);
  labelValue("Estimated Profit", money(quotation.profit_usd), 132, 211);

  // Alternatives
  section("Alternative Routes", 14, 232, 110);
  section("Terms & Conditions", 128, 232, 68);
  const rows = alternatives.slice(0, 3);
  let ay = 244;
  doc.setFillColor(225, 238, 244);
  doc.rect(14, ay - 5, 110, 8, "F");
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("ROUTE", 18, ay);
  doc.text("DISTANCE", 77, ay);
  doc.text("TRANSIT", 105, ay);
  ay += 8;
  doc.setFont("helvetica", "normal");
  rows.forEach((item) => {
    doc.setTextColor(...ink);
    doc.text(`${item.origin || origin} → ${item.destination || destination}`.slice(0, 38), 18, ay);
    doc.text(`${item.distance_nm ?? "N/A"} NM`, 77, ay);
    doc.text(`${item.estimated_days ?? "N/A"} days`, 105, ay);
    doc.setDrawColor(...line);
    doc.line(14, ay + 3, 124, ay + 3);
    ay += 8;
  });
  if (!rows.length) {
    doc.setTextColor(...muted);
    doc.text("No alternative routes available.", 18, ay);
  }

  const terms = [
    "Quotation subject to route and capacity availability.",
    "Transit time is an estimate and may vary.",
    "Prices may change with operational conditions.",
    "Final booking requires confirmation.",
  ];
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.1);
  terms.forEach((term, i) => doc.text(`• ${term}`, 133, 247 + i * 8));

  // Appreciation
  doc.setFillColor(...navy);
  doc.roundedRect(14, 271, 182, 20, 3, 3, "F");
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Thank you for choosing MaritimeAI", 20, 280);
  doc.setTextColor(165, 208, 222);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.text("AI-powered shipping intelligence for smarter logistics decisions.", 20, 286);

  // Footer
  doc.setFillColor(...navy);
  doc.rect(0, H - 15, W, 15, "F");
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("MaritimeAI", 14, H - 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 202, 216);
  doc.text("Intelligent Shipping  •  AI Route Optimization  •  Freight Intelligence", W / 2, H - 7, { align: "center" });
  doc.text("Generated electronically", W - 14, H - 7, { align: "right" });


  // ── Page 2: Shipment Risk & Customs Clearance ─────────────────────────────
  if (quotation.overall_risk_level) {
    doc.addPage();

    // Page header
    doc.setFillColor(...navy);
    doc.rect(0, 0, W, 28, "F");
    doc.setFillColor(...cyan);
    doc.roundedRect(14, 6, 11, 11, 2, 2, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("M", 17.5, 13.5);
    doc.setFontSize(13);
    doc.text("MaritimeAI", 30, 14);
    doc.setTextColor(163, 207, 222);
    doc.setFontSize(7);
    doc.setCharSpace(1.2);
    doc.text("INTELLIGENT SHIPPING", 31, 20);
    doc.setCharSpace(0);
    doc.setTextColor(...white);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Quotation: ${quotationNumber}`, W - 14, 14, { align: "right" });
    doc.text(`Date: ${dateText}`, W - 14, 21, { align: "right" });

    // Page title
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Shipment Risk & Customs Clearance", 14, 46);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("AI-generated risk assessment for this shipment", 14, 53);

    // Helper to render a colored risk pill inline in PDF
    const riskColor = (level) => {
      switch ((level || "").toUpperCase()) {
        case "HIGH":   return [248, 113, 113];
        case "MEDIUM": return [245, 158, 11];
        default:       return [52, 211, 153];
      }
    };

    const riskPill = (level, x, y) => {
      const col = riskColor(level);
      doc.setFillColor(...col);
      doc.roundedRect(x, y - 5, 22, 7, 2, 2, "F");
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text((level || "N/A").toUpperCase(), x + 11, y + 0.2, { align: "center" });
    };

    // Risk overview section
    section("Risk Overview", 14, 62, 182);

    const overallLevel   = quotation.overall_risk_level  || "N/A";
    const weatherLevel   = quotation.weather_risk?.risk_level  || "N/A";
    const customsLevel   = quotation.customs_risk?.customs_risk_level || "N/A";
    const totalPts       = quotation.total_risk_points ?? 0;
    const validationSt   = quotation.customs_risk?.validation_status || "N/A";

    // Labels row
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.text("OVERALL RISK", 20, 79);
    doc.text("WEATHER RISK", 78, 79);
    doc.text("CUSTOMS RISK", 136, 79);

    // Coloured pills
    riskPill(overallLevel,  20, 91);
    riskPill(weatherLevel,  78, 91);
    riskPill(customsLevel, 136, 91);

    // Total risk points
    doc.setFillColor(...light);
    doc.roundedRect(14, 100, 182, 14, 3, 3, "F");
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.text("TOTAL RISK POINTS", 20, 108);
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${totalPts} pts`, 100, 108);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.text("CUSTOMS VALIDATION", 140, 108);
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(validationSt, 172, 108);

    // Risk summary
    section("Risk Summary", 14, 122, 182);
    const summaryText = quotation.risk_summary || "No risk summary available.";
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const summaryLines = doc.splitTextToSize(summaryText, 172);
    doc.text(summaryLines, 20, 138);

    // Operational recommendations
    const summaryBlockH = Math.max(summaryLines.length * 5, 14);
    const recTop = 130 + summaryBlockH;
    section("Operational Recommendations", 14, recTop, 182);
    const recs = Array.isArray(quotation.operational_recommendations)
      ? quotation.operational_recommendations
      : [];
    let ry = recTop + 16;
    if (recs.length === 0) {
      doc.setTextColor(...muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("No recommendations at this time.", 20, ry);
    } else {
      recs.forEach((rec) => {
        doc.setTextColor(...ink);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const recLines = doc.splitTextToSize(`• ${rec}`, 168);
        doc.text(recLines, 20, ry);
        ry += recLines.length * 5 + 4;
      });
    }

    // Page 2 footer
    doc.setFillColor(...navy);
    doc.rect(0, H - 15, W, 15, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("MaritimeAI", 14, H - 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 202, 216);
    doc.text("Intelligent Shipping  •  AI Route Optimization  •  Freight Intelligence", W / 2, H - 7, { align: "center" });
    doc.text("Page 2", W - 14, H - 7, { align: "right" });
  }

  doc.save(`MaritimeAI_Quotation_${quotationNumber}.pdf`);
};

function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [containers, setContainers] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("maritimeLoggedIn") === "true";
  });

  // Current user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("maritimeCurrentUser");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved =
        localStorage.getItem("recentSearches");

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "recentSearches",
      JSON.stringify(recentSearches)
    );
  }, [recentSearches]);

  const scrollToSection = (id, tab) => {
    if (tab) {
      setActiveTab(tab);
    }

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const handleLogin = (user) => {
    localStorage.setItem(
      "maritimeLoggedIn",
      "true"
    );

    localStorage.setItem(
      "maritimeCurrentUser",
      JSON.stringify(user)
    );

    setCurrentUser(user);
    setIsLoggedIn(true);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("maritimeLoggedIn");
    localStorage.removeItem("maritimeCurrentUser");

    setCurrentUser(null);
    setIsLoggedIn(false);
    setProfileOpen(false);

    setResult(null);
    setOrigin("");
    setDestination("");
    setCargoType("");
    setContainers("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (
      !origin ||
      !destination ||
      !cargoType ||
      !containers
    ) {
      alert("Please fill all shipment details.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {

      const response = await fetch(
        "http://127.0.0.1:8001/api/quotations/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: origin.trim(),
            destination: destination.trim(),
            cargo_type: cargoType.trim(),
            containers: Number(containers),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const displayResult = {
        ...data,
        status:
          data.status === "success"
            ? "found"
            : data.status,
        recommendation: data.recommendation || {
          match_percentage: data.route_score ?? 0,
          cargo_match:
            data.recommended_route?.cargo_match ?? false,
          container_difference:
            data.recommended_route?.container_difference ?? 0,
          recommendation_reason:
            "Recommended route selected by the Route Agent.",
        },
        route_info:
          data.route_info || data.recommended_route,
        all_routes:
          data.all_routes ||
          data.alternatives ||
          (data.recommended_route
            ? [data.recommended_route]
            : []),
        total_routes_found:
          data.total_routes_found ||
          ((data.alternatives?.length || 0) +
            (data.recommended_route ? 1 : 0)),
      };

      setResult(displayResult);

      const newSearch = {
        origin: origin.trim(),
        destination: destination.trim(),
        cargoType: cargoType.trim(),
        containers: Number(containers),
        status: displayResult.status,
      };

      setRecentSearches((previous) => {
        const filtered = previous.filter(
          (item) =>
            !(
              item.origin.toLowerCase() ===
                origin.trim().toLowerCase() &&
              item.destination.toLowerCase() ===
                destination.trim().toLowerCase() &&
              item.cargoType.toLowerCase() ===
                cargoType.trim().toLowerCase() &&
              Number(item.containers) ===
                Number(containers)
            )
        );

        return [newSearch, ...filtered].slice(0, 5);
      });

      if (displayResult.status === "found") {
        setTimeout(() => {
          document
            .getElementById("fleet-intelligence")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });

          setActiveTab("fleet");
        }, 250);
      }
    } catch (error) {
      console.error(error);

      setResult({
        status: "error",
        message:
          "Unable to connect to the backend server.",
      });
    }

    setLoading(false);
  };

  const useRecentSearch = (search) => {
    setOrigin(search.origin);
    setDestination(search.destination);
    setCargoType(search.cargoType);
    setContainers(String(search.containers));

    scrollToSection(
      "route-analysis",
      "route"
    );
  };

  const clearHistory = () => {
    localStorage.removeItem("recentSearches");
    setRecentSearches([]);
  };

  const matchingRoutes =
    result?.all_routes ||
    (result?.route_info
      ? [result.route_info]
      : []);

  const totalRoutes =
    result?.total_routes_found ||
    matchingRoutes.length;

  const matchScore =
    result?.recommendation
      ?.match_percentage ?? 100;

  const bestRoute =
    result?.route_info;

  // Login page
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  // ADMIN HAS A COMPLETELY SEPARATE WORKSPACE
  if (currentUser?.role === "admin") {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        {/* BRAND */}

        <div
          className="brand"
          onClick={() =>
            scrollToSection(
              "dashboard",
              "dashboard"
            )
          }
        >
          <div className="logo-box">
            ⚓
          </div>

          <div className="brand-text">
            <h1>
              MaritimeAI
            </h1>

            <p>
              INTELLIGENT SHIPPING
            </p>
          </div>
        </div>


        {/* NAVIGATION */}

        <div className="nav-links">

          <button
            className={
              activeTab === "dashboard"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() =>
              scrollToSection(
                "dashboard",
                "dashboard"
              )
            }
          >
            Dashboard
          </button>


          <button
            className={
              activeTab === "route"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() =>
              scrollToSection(
                "route-analysis",
                "route"
              )
            }
          >
            New Shipment
          </button>




          <button
            className={
              activeTab === "history"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() =>
              scrollToSection(
                "recent-searches",
                "history"
              )
            }
          >
            My Shipments
          </button>

        </div>


        {/* =====================================================
            PROFILE
        ===================================================== */}

        <div className="profile-wrapper">

          <button
            className="profile-button"
            onClick={() =>
              setProfileOpen(
                (previous) => !previous
              )
            }
            aria-label="Open user profile"
          >

            <div className="profile-avatar">
              {currentUser?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <span className="profile-arrow">
              ▾
            </span>

          </button>


          {profileOpen && (

            <div className="profile-dropdown">

              {/* PROFILE HEADER */}

              <div className="profile-dropdown-header">

                <div className="profile-avatar large">
                  {currentUser?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <div className="profile-header-info">

                  <strong>
                    {currentUser?.name || "User"}
                  </strong>

                  <span>
                    {currentUser?.email || ""}
                  </span>

                </div>

              </div>


              {/* ACCOUNT STATUS */}

              <div className="profile-status">

                <span className="profile-status-dot"></span>

                <span>
                  Account Active
                </span>

              </div>


              <div className="profile-divider"></div>


              {/* USER DETAILS */}

              <div className="profile-details">

                <div className="profile-detail-row">

                  <span className="profile-detail-label">
                    FULL NAME
                  </span>

                  <span className="profile-detail-value">
                    {currentUser?.name ||
                      "Not available"}
                  </span>

                </div>


                <div className="profile-detail-row">

                  <span className="profile-detail-label">
                    EMAIL ADDRESS
                  </span>

                  <span className="profile-detail-value email-value">
                    {currentUser?.email ||
                      "Not available"}
                  </span>

                </div>

              </div>


              <div className="profile-divider"></div>


              {/* LOGOUT */}

              <button
                className="profile-logout"
                onClick={handleLogout}
              >

                <span>
                  ⇥
                </span>

                <span>
                  Logout
                </span>

              </button>

            </div>

          )}

        </div>

      </nav>


      {/* =====================================================
          HERO / DASHBOARD
      ===================================================== */}

      <section
        className="hero"
        id="dashboard"
      >

        <img
          className="hero-image"
          src="/images/maritime-hero.png"
          alt="Container ship sailing on the ocean"
        />

        <div className="hero-overlay"></div>


        <div className="hero-content">

          <div className="hero-badge">
            ✦ AI-POWERED MARITIME INTELLIGENCE
          </div>


          <h2>
            Smarter Shipping.
            <span>
              Better Decisions.
            </span>
          </h2>


          <p>
            Plan shipments, compare routes and
            get AI-powered freight pricing
            from one place.
          </p>


          <div className="stats-container">

            <div className="stat-card">

              <div className="stat-icon blue">
                ⚓
              </div>

              <div>

                <strong>
                  900+
                </strong>

                <span>
                  Route Records
                </span>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon green">
                ◉
              </div>

              <div>

                <strong>
                  AI
                </strong>

                <span>
                  Smart Matching
                </span>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon yellow">
                ◷
              </div>

              <div>

                <strong>
                  24/7
                </strong>

                <span>
                  System Ready
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =====================================================
          CUSTOMER SHIPMENT ACTIONS
      ===================================================== */}
      <section className="customer-actions-clean">
        <div>
          <span className="eyebrow">SHIPMENT MANAGEMENT</span>
          <h2>What would you like to do today?</h2>
          <p>Plan a shipment, review your quotation, or open your recent requests.</p>
        </div>
        <div className="customer-actions-buttons">
          <button className="command-button primary" onClick={() => scrollToSection("route-analysis", "route")}>+ New Shipment</button>
          <button className="command-button" onClick={() => scrollToSection("recent-searches", "history")}>My Shipments</button>
        </div>
      </section>

      {/* =====================================================
          ADVANCED INSIGHTS
      ===================================================== */}
      {result?.status === "found" && (
        <section className="advanced-insights">
          <div className="insight-header">
            <div>
              <span className="eyebrow">SHIPMENT INSIGHTS</span>
              <h2>Your AI shipment summary</h2>
            </div>
            <span className="analysis-complete">✓ Analysis Complete</span>
          </div>

          <div className="insight-grid">
            <div className="insight-box">
              <span>ROUTE MATCH</span>
              <strong>{matchScore}%</strong>
              <p>AI compatibility score for this shipment.</p>
            </div>

            <div className="insight-box">
              <span>AVAILABLE OPTIONS</span>
              <strong>{totalRoutes}</strong>
              <p>Routes found for your shipment requirements.</p>
            </div>

            <div className="insight-box">
              <span>TRANSIT TIME</span>
              <strong>{bestRoute?.estimated_days ?? "—"} <small>days</small></strong>
              <p>Estimated transit for the recommended route.</p>
            </div>

            <div className="insight-box">
              <span>ESTIMATED PRICE</span>
              <strong>
                {result.customer_price_usd != null
                  ? `$${Number(result.customer_price_usd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                  : "—"}
              </strong>
              <p>AI-generated customer quotation.</p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          RECENT SHIPMENTS
      ===================================================== */}
      <section className="recent-shipments-section" id="recent-searches">
        <div className="recent-heading">
          <div>
            <span className="eyebrow">MY SHIPMENTS</span>
            <h2>Recent shipment requests</h2>
            <p>Your latest route searches are stored locally for quick reuse.</p>
          </div>

          {recentSearches.length > 0 && (
            <button className="clear-history-button" onClick={clearHistory}>
              Clear History
            </button>
          )}
        </div>

        {recentSearches.length === 0 ? (
          <div className="recent-empty">
            <div>⌁</div>
            <strong>No recent shipments yet</strong>
            <span>Run your first AI shipment analysis to see it here.</span>
          </div>
        ) : (
          <div className="recent-shipment-list">
            {recentSearches.map((search, index) => (
              <button
                className="recent-shipment-item"
                key={`${search.origin}-${search.destination}-${search.containers}-${index}`}
                onClick={() => useRecentSearch(search)}
              >
                <div className="recent-route">
                  <strong>{search.origin}</strong>
                  <span>→</span>
                  <strong>{search.destination}</strong>
                </div>
                <div className="recent-meta">
                  <span>{search.cargoType}</span>
                  <span>{search.containers} containers</span>
                  <span className={search.status === "found" ? "recent-status found" : "recent-status"}>
                    {search.status === "found" ? "Route Found" : "No Route"}
                  </span>
                </div>
                <span className="recent-open">Open →</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main-content">

        {/* ROUTE ANALYSIS IS THE PRIMARY CUSTOMER WORKSPACE */}

        {/* =================================================
            ROUTE ANALYSIS
        ================================================= */}

        <section
          className="analysis-card"
          id="route-analysis"
        >

          <div className="analysis-header">

            <div className="section-icon">
              ⚓
            </div>

            <div>

              <span>
                ROUTE ANALYSIS
              </span>

              <h2>
                Plan Your Shipment
              </h2>

              <p>
                Enter shipment details to
                find the best available route.
              </p>

            </div>

          </div>


          <form onSubmit={handleAnalyze}>

            <div className="form-grid">

              {/* ORIGIN */}

              <div className="input-group">

                <label>
                  Origin
                </label>

                <div className="input-wrapper">

                  <span>
                    ⌖
                  </span>

                  <input
                    type="text"
                    placeholder="e.g., Mumbai"
                    value={origin}
                    onChange={(e) =>
                      setOrigin(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* DESTINATION */}

              <div className="input-group">

                <label>
                  Destination
                </label>

                <div className="input-wrapper">

                  <span>
                    ⚑
                  </span>

                  <input
                    type="text"
                    placeholder="e.g., Singapore"
                    value={destination}
                    onChange={(e) =>
                      setDestination(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* CARGO */}

              <div className="input-group">

                <label>
                  Cargo Type
                </label>

                <div className="input-wrapper">

                  <span>
                    ◇
                  </span>

                  <input
                    type="text"
                    placeholder="e.g., Bulk Cargo"
                    value={cargoType}
                    onChange={(e) =>
                      setCargoType(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* CONTAINERS */}

              <div className="input-group">

                <label>
                  Containers
                </label>

                <div className="input-wrapper">

                  <span>
                    ▦
                  </span>

                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={containers}
                    onChange={(e) =>
                      setContainers(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

            </div>


            <button
              className="analyze-button"
              type="submit"
              disabled={loading}
            >

              {loading ? (

                <>
                  <span className="spinner"></span>
                  Analyzing Routes...
                </>

              ) : (

                <>
                  ⌕ Analyze Shipment
                  <b>→</b>
                </>

              )}

            </button>

          </form>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {result?.status === "error" && (

          <section className="error-card">

            <div className="error-icon">
              !
            </div>

            <h2>
              Connection Error
            </h2>

            <p>
              {result.message}
            </p>

          </section>

        )}


        {/* =================================================
            NOT FOUND
        ================================================= */}

        {result?.status === "not_found" && (

          <section className="not-found-card">

            <div className="error-icon">
              !
            </div>

            <h2>
              No Matching Route Found
            </h2>

            <p>
              {result.message}
            </p>


            <div className="searched-details">

              <div>

                <span>
                  Origin
                </span>

                <strong>
                  {result.origin}
                </strong>

              </div>


              <div>

                <span>
                  Destination
                </span>

                <strong>
                  {result.destination}
                </strong>

              </div>


              <div>

                <span>
                  Cargo
                </span>

                <strong>
                  {result.cargo_type}
                </strong>

              </div>


              <div>

                <span>
                  Containers
                </span>

                <strong>
                  {result.containers}
                </strong>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            FLEET INTELLIGENCE
        ================================================= */}

        <section
          className="fleet-intelligence"
          id="fleet-intelligence"
        >

          <div className="fleet-header">

            <div>

              <span>
                ROUTE & VESSEL RESULTS
              </span>

              <h2>
                Your route and vessel recommendation
              </h2>

              <p>
                Review the recommended route, vessel details, alternatives and freight quotation for this shipment.
              </p>

            </div>


            {bestRoute && (

              <div className="fleet-route-badge">

                {bestRoute.origin}

                <b>
                  →
                </b>

                {bestRoute.destination}

              </div>

            )}

          </div>


          {/* EMPTY */}

          {!result && (

            <div className="fleet-empty">

              <div className="fleet-empty-icon">
                🚢
              </div>

              <h3>
                Ready for Route Analysis
              </h3>

              <p>
                Enter your shipment details above to view the AI recommendation and quotation.
              </p>

            </div>

          )}


          {/* RESULT */}

          {result?.status === "found" && (

            <>

              {/* BEST ROUTE */}

              <div className="best-route-panel">

                <div className="best-route-info">

                  <span className="best-label">
                    ✦ AI BEST RECOMMENDATION
                  </span>

                  <h3>

                    {bestRoute.origin}

                    <b>
                      →
                    </b>

                    {bestRoute.destination}

                  </h3>

                  <p>
                    Best matching vessel selected
                    from {totalRoutes} available
                    route
                    {totalRoutes !== 1
                      ? "s"
                      : ""}.
                  </p>

                </div>


                <div className="match-score">

                  <span>
                    MATCH SCORE
                  </span>

                  <strong>
                    {matchScore}%
                  </strong>

                  <small>
                    AI MATCH
                  </small>

                </div>

              </div>


              {/* SUMMARY */}

              <div className="route-summary-grid">


                <div className="summary-card">

                  <span>
                    DISTANCE
                  </span>

                  <strong>

                    {bestRoute.distance_nm !==
                      null &&
                    bestRoute.distance_nm !==
                      undefined

                      ? `${Number(
                          bestRoute.distance_nm
                        ).toLocaleString()} NM`

                      : "N/A"}

                  </strong>

                  <small>
                    Nautical Miles
                  </small>

                </div>


                <div className="summary-card">

                  <span>
                    ESTIMATED TRANSIT
                  </span>

                  <strong>

                    {bestRoute.estimated_days !==
                      null &&
                    bestRoute.estimated_days !==
                      undefined

                      ? `${bestRoute.estimated_days} days`

                      : "N/A"}

                  </strong>

                  <small>
                    Based on vessel speed
                  </small>

                </div>


                <div className="summary-card">

                  <span>
                    VESSEL SPEED
                  </span>

                  <strong>
                    {bestRoute.speed} knots
                  </strong>

                  <small>
                    Recommended vessel
                  </small>

                </div>


                <div className="summary-card">

                  <span>
                    ROUTES FOUND
                  </span>

                  <strong>
                    {totalRoutes}
                  </strong>

                  <small>
                    Exact route matches
                  </small>

                </div>

              </div>


              {/* PRICING & QUOTATION */}

              <div className="quotation-result">
                <div
                  className="fleet-card"
                  style={{
                    overflow: "hidden",
                    borderRadius: "22px"
                  }}
                >
                  <div
                    className="fleet-card-heading"
                    style={{
                      alignItems: "center",
                      marginBottom: "20px"
                    }}
                  >
                    <div>
                      <span style={{ letterSpacing: "1.5px" }}>
                        FREIGHT PRICING
                      </span>
                      <h3 style={{ marginBottom: "4px" }}>
                        Customer Quotation
                      </h3>
                      <button
                        type="button"
                        className="download-quotation-btn"
                        onClick={() => downloadQuotationPDF(result, currentUser)}
                      >
                        ↓ Download Freight Quotation
                      </button>
                      <p
                        style={{
                          margin: 0,
                          opacity: 0.72,
                          fontSize: "13px"
                        }}
                      >
                        Route costs, market demand and brokerage margin combined.
                      </p>
                    </div>

                    <div
                      className="fleet-card-icon"
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px"
                      }}
                    >
                      💰
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "24px",
                      borderRadius: "20px",
                      marginBottom: "18px",
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,0.13), rgba(16,185,129,0.09))",
                      border: "1px solid rgba(148,163,184,0.22)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "1.5px",
                            opacity: 0.7
                          }}
                        >
                          RECOMMENDED CUSTOMER PRICE
                        </span>

                        <strong
                          className="quotation-price"
                          style={{
                            display: "block",
                            fontSize: "42px",
                            lineHeight: 1.1,
                            marginTop: "7px"
                          }}
                        >
                          ${Number(
                            result.customer_price_usd ?? 0
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: "7px",
                            fontSize: "12px",
                            opacity: 0.7
                          }}
                        >
                          Final quote for this shipment
                        </span>
                      </div>

                      <div
                        style={{
                          padding: "14px 18px",
                          borderRadius: "15px",
                          background: "rgba(255,255,255,0.07)",
                          minWidth: "150px"
                        }}
                      >
                        <small
                          style={{
                            display: "block",
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "1px",
                            opacity: 0.65
                          }}
                        >
                          BROKERAGE PROFIT
                        </small>

                        <strong
                          style={{
                            display: "block",
                            fontSize: "22px",
                            marginTop: "6px"
                          }}
                        >
                          ${Number(
                            result.profit_usd ?? 0
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </strong>

                        <small
                          style={{
                            display: "block",
                            marginTop: "4px",
                            opacity: 0.65
                          }}
                        >
                          {result.actual_margin_percent ?? 0}% margin
                        </small>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: "14px",
                      marginBottom: "18px"
                    }}
                  >
                    <div className="summary-card">
                      <span>OPERATING COST</span>
                      <strong>
                        ${Number(
                          result.operating_cost_usd ?? 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                      <small>Base + surcharges</small>
                    </div>

                    <div className="summary-card">
                      <span>BASE FREIGHT</span>
                      <strong>
                        ${Number(
                          result.base_freight_usd ?? 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                      <small>Distance-based freight</small>
                    </div>

                    <div className="summary-card">
                      <span>TARGET MARGIN</span>
                      <strong>
                        {result.target_margin_percent ?? 0}%
                      </strong>
                      <small>Brokerage target</small>
                    </div>

                    <div className="summary-card">
                      <span>DEMAND FACTOR</span>
                      <strong>
                        {result.demand_factor ?? "N/A"}
                      </strong>
                      <small>Market adjustment</small>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "18px 20px",
                      borderRadius: "17px",
                      border: "1px solid rgba(148,163,184,0.18)",
                      background: "rgba(255,255,255,0.025)"
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: "12px"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px"
                        }}
                      >
                        <span style={{ opacity: 0.68 }}>
                          Fuel Surcharge
                        </span>
                        <strong>
                          ${Number(
                            result.fuel_surcharge_usd ?? 0
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px"
                        }}
                      >
                        <span style={{ opacity: 0.68 }}>
                          Port Charge
                        </span>
                        <strong>
                          ${Number(
                            result.port_charge_usd ?? 0
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px"
                        }}
                      >
                        <span style={{ opacity: 0.68 }}>
                          Risk Surcharge
                        </span>
                        <strong>
                          ${Number(
                            result.risk_surcharge_usd ?? 0
                          ).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    className="recommendation-reason"
                    style={{ marginTop: "18px" }}
                  >
                    <span className="quotation-status">
                      ✓ QUOTATION GENERATED
                    </span>
                    <p>
                      Price calculated using route costs, demand adjustment and
                      the target brokerage margin.
                    </p>
                  </div>
                </div>
              </div>


              {/* MARGIN OPTIMIZATION */}

              <div className="quotation-result">
                <div
                  className="fleet-card"
                  style={{
                    overflow: "hidden",
                    borderRadius: "22px"
                  }}
                >
                  <div
                    className="fleet-card-heading"
                    style={{
                      alignItems: "center",
                      marginBottom: "18px"
                    }}
                  >
                    <div>
                      <span style={{ letterSpacing: "1.5px" }}>
                        MARGIN OPTIMIZATION
                      </span>
                      <h3 style={{ marginBottom: "4px" }}>
                        Pricing Strategy Options
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          opacity: 0.72,
                          fontSize: "13px"
                        }}
                      >
                        Compare possible margins and choose a profitable quote.
                      </p>
                    </div>
                    <div
                      className="fleet-card-icon"
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px"
                      }}
                    >
                      📈
                    </div>
                  </div>

                  {result.recommended_margin && (
                    <div
                      style={{
                        padding: "22px",
                        borderRadius: "18px",
                        marginBottom: "18px",
                        background:
                          "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(59,130,246,0.10))",
                        border: "1px solid rgba(16,185,129,0.25)"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "20px",
                          flexWrap: "wrap"
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              letterSpacing: "1.4px",
                              opacity: 0.75
                            }}
                          >
                            AI RECOMMENDED MARGIN
                          </span>
                          <div
                            style={{
                              fontSize: "38px",
                              fontWeight: 900,
                              lineHeight: 1.05,
                              marginTop: "8px"
                            }}
                          >
                            {result.recommended_margin.target_margin_percent}%
                          </div>
                          <p
                            style={{
                              margin: "8px 0 0",
                              opacity: 0.78,
                              fontSize: "13px"
                            }}
                          >
                            Best option from the available pricing strategies
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap"
                          }}
                        >
                          <div
                            style={{
                              padding: "13px 16px",
                              borderRadius: "14px",
                              background: "rgba(255,255,255,0.08)",
                              minWidth: "145px"
                            }}
                          >
                            <small style={{ opacity: 0.7 }}>
                              CUSTOMER PRICE
                            </small>
                            <strong
                              style={{
                                display: "block",
                                marginTop: "5px",
                                fontSize: "20px"
                              }}
                            >
                              ${Number(
                                result.recommended_margin.customer_price_usd ?? 0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </strong>
                          </div>

                          <div
                            style={{
                              padding: "13px 16px",
                              borderRadius: "14px",
                              background: "rgba(255,255,255,0.08)",
                              minWidth: "145px"
                            }}
                          >
                            <small style={{ opacity: 0.7 }}>
                              EXPECTED PROFIT
                            </small>
                            <strong
                              style={{
                                display: "block",
                                marginTop: "5px",
                                fontSize: "20px"
                              }}
                            >
                              ${Number(
                                result.recommended_margin.profit_usd ?? 0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.margin_options?.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px"
                      }}
                    >
                      {result.margin_options.map((option) => {
                        const isRecommended =
                          option.target_margin_percent ===
                          result.recommended_margin?.target_margin_percent;

                        return (
                          <div
                            key={option.target_margin_percent}
                            style={{
                              position: "relative",
                              padding: "20px",
                              borderRadius: "18px",
                              border: isRecommended
                                ? "2px solid rgba(16,185,129,0.65)"
                                : "1px solid rgba(148,163,184,0.18)",
                              background: isRecommended
                                ? "rgba(16,185,129,0.09)"
                                : "rgba(255,255,255,0.035)",
                              boxShadow: isRecommended
                                ? "0 10px 28px rgba(16,185,129,0.10)"
                                : "none",
                              transition: "transform 0.2s ease"
                            }}
                          >
                            {isRecommended && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "12px",
                                  right: "12px",
                                  padding: "5px 8px",
                                  borderRadius: "999px",
                                  fontSize: "9px",
                                  fontWeight: 900,
                                  letterSpacing: "0.8px",
                                  background: "rgba(16,185,129,0.18)"
                                }}
                              >
                                BEST
                              </span>
                            )}

                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                opacity: 0.65
                              }}
                            >
                              {option.target_margin_percent}% MARGIN
                            </span>

                            <div
                              style={{
                                fontSize: "30px",
                                fontWeight: 900,
                                margin: "8px 0 16px"
                              }}
                            >
                              {option.target_margin_percent}%
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gap: "9px",
                                fontSize: "13px"
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "10px"
                                }}
                              >
                                <span style={{ opacity: 0.65 }}>
                                  Customer Price
                                </span>
                                <strong>
                                  ${Number(
                                    option.customer_price_usd ?? 0
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </strong>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "10px"
                                }}
                              >
                                <span style={{ opacity: 0.65 }}>
                                  Profit
                                </span>
                                <strong>
                                  ${Number(
                                    option.profit_usd ?? 0
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>


              {/* SHIPMENT RISK */}

              {result?.overall_risk_level && (
                <div className="quotation-result">
                  <div
                    className="fleet-card"
                    style={{ overflow: "hidden", borderRadius: "22px" }}
                  >
                    <div
                      className="fleet-card-heading"
                      style={{ alignItems: "center", marginBottom: "18px" }}
                    >
                      <div>
                        <span style={{ letterSpacing: "1.5px" }}>
                          SHIPMENT RISK &amp; CUSTOMS CLEARANCE
                        </span>
                        <h3 style={{ margin: "6px 0 0" }}>
                          Shipment Risk Assessment
                        </h3>
                      </div>
                      <span
                        className={`risk-badge risk-badge-${(result.overall_risk_level || "").toLowerCase()}`}
                      >
                        {result.overall_risk_level} RISK
                      </span>
                    </div>

                    {/* Risk grid: Overall / Weather / Customs */}
                    <div className="risk-grid">
                      <div className="risk-grid-item">
                        <span className="risk-grid-label">Overall Risk</span>
                        <span
                          className={`risk-badge risk-badge-${(result.overall_risk_level || "").toLowerCase()}`}
                        >
                          {result.overall_risk_level ?? "N/A"}
                        </span>
                      </div>

                      <div className="risk-grid-item">
                        <span className="risk-grid-label">Weather Risk</span>
                        <span
                          className={`risk-badge risk-badge-${(result.weather_risk?.risk_level || "").toLowerCase()}`}
                        >
                          {result.weather_risk?.risk_level ?? "N/A"}
                        </span>
                      </div>

                      <div className="risk-grid-item">
                        <span className="risk-grid-label">Customs Risk</span>
                        <span
                          className={`risk-badge risk-badge-${(result.customs_risk?.customs_risk_level || "").toLowerCase()}`}
                        >
                          {result.customs_risk?.customs_risk_level ?? "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Total risk points */}
                    <div className="risk-points-row">
                      <span className="risk-grid-label">Total Risk Points</span>
                      <strong className="risk-points-value">
                        {result.total_risk_points ?? 0} pts
                      </strong>
                    </div>

                    {/* Risk summary */}
                    {result.risk_summary && (
                      <div className="risk-summary-block">
                        <span className="risk-grid-label">Risk Summary</span>
                        <p className="risk-summary-text">{result.risk_summary}</p>
                      </div>
                    )}

                    {/* Operational recommendations */}
                    {Array.isArray(result.operational_recommendations) &&
                      result.operational_recommendations.length > 0 && (
                        <div className="risk-summary-block">
                          <span className="risk-grid-label">
                            Operational Recommendations
                          </span>
                          <ul className="risk-rec-list">
                            {result.operational_recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Customs validation status */}
                    {result.customs_risk?.validation_status && (
                      <div className="risk-points-row" style={{ marginTop: "10px" }}>
                        <span className="risk-grid-label">Customs Validation</span>
                        <span
                          className={`risk-badge risk-badge-${
                            result.customs_risk.validation_status === "VALID"
                              ? "low"
                              : result.customs_risk.validation_status === "CONDITIONAL"
                              ? "medium"
                              : "high"
                          }`}
                        >
                          {result.customs_risk.validation_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* AI + VESSEL */}

              <div className="fleet-grid">


                {/* AI CARD */}

                <div
                  className="fleet-card"
                  style={{
                    overflow: "hidden",
                    borderRadius: "22px"
                  }}
                >
                  <div
                    className="fleet-card-heading"
                    style={{
                      alignItems: "center",
                      marginBottom: "18px"
                    }}
                  >
                    <div>
                      <span style={{ letterSpacing: "1.5px" }}>
                        AI ANALYSIS
                      </span>
                      <h3 style={{ marginBottom: "4px" }}>
                        Route Intelligence
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          opacity: 0.7,
                          fontSize: "13px"
                        }}
                      >
                        AI evaluates route fit before recommending a vessel.
                      </p>
                    </div>

                    <div
                      className="fleet-card-icon"
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px"
                      }}
                    >
                      🤖
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "20px",
                      borderRadius: "18px",
                      marginBottom: "16px",
                      background: "rgba(255,255,255,0.035)",
                      border: "1px solid rgba(148,163,184,0.18)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "12px"
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "1.2px",
                            opacity: 0.65
                          }}
                        >
                          OVERALL ROUTE MATCH
                        </span>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "36px",
                            lineHeight: 1.1,
                            marginTop: "5px"
                          }}
                        >
                          {matchScore}%
                        </strong>
                      </div>

                      <span
                        style={{
                          padding: "7px 11px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 900,
                          letterSpacing: "0.8px",
                          border: "1px solid rgba(148,163,184,0.22)"
                        }}
                      >
                        AI MATCH
                      </span>
                    </div>

                    <div
                      style={{
                        height: "9px",
                        borderRadius: "999px",
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.12)",
                        width: "100%"
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              parseFloat(matchScore) || 0
                            )
                          )}%`,
                          minWidth:
                            (parseFloat(matchScore) || 0) > 0
                              ? "6px"
                              : "0",
                          height: "100%",
                          borderRadius: "999px",
                          background:
                            "linear-gradient(90deg, #60a5fa, #34d399)",
                          transition: "width 0.5s ease"
                        }}
                      ></div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "12px",
                      marginBottom: "16px"
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "16px",
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "rgba(255,255,255,0.025)"
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          opacity: 0.65
                        }}
                      >
                        CARGO COMPATIBILITY
                      </span>
                      <strong
                        style={{
                          display: "block",
                          marginTop: "9px",
                          fontSize: "18px"
                        }}
                      >
                        {result.recommendation?.cargo_match ? "MATCH" : "REVIEW"}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: "4px",
                          opacity: 0.6
                        }}
                      >
                        Shipment cargo fit
                      </small>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "16px",
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "rgba(255,255,255,0.025)"
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          opacity: 0.65
                        }}
                      >
                        CONTAINER FIT
                      </span>
                      <strong
                        style={{
                          display: "block",
                          marginTop: "9px",
                          fontSize: "18px"
                        }}
                      >
                        {result.recommendation?.container_difference ?? 0}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: "4px",
                          opacity: 0.6
                        }}
                      >
                        Container difference
                      </small>
                    </div>
                  </div>

                  <div
                     className="recommendation-reason"
                     style={{
                       marginTop: 0,
                       padding: "17px 18px"
                     }}
                   >
                     <span style={{ letterSpacing: "1px" }}>
                       WHY DID AI SELECT THIS ROUTE?
                     </span>
                     <p>
                       This route offers the best overall fit for the shipment based on cargo compatibility, container capacity, and transit time.
                     </p>
                   </div>
                </div>


                {/* VESSEL CARD */}

                <div className="fleet-card">

                  <div className="fleet-card-heading">

                    <div>

                      <span>
                        RECOMMENDED VESSEL
                      </span>

                      <h3>
                        {
                          bestRoute
                            .recommended_ship
                        }
                      </h3>

                    </div>

                    <div className="fleet-card-icon">
                      🚢
                    </div>

                  </div>


                  <div className="vessel-highlight">

                    <strong>
                      {
                        bestRoute
                          .recommended_ship
                      }
                    </strong>

                    <span>
                      Best matching vessel
                    </span>

                  </div>


                  <div className="vessel-grid">

                    <div>

                      <span>
                        IMO NUMBER
                      </span>

                      <strong>
                        {
                          bestRoute
                            .imo_number
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        SPEED
                      </span>

                      <strong>
                        {bestRoute.speed}
                        {" "}
                        knots
                      </strong>

                    </div>


                    <div>

                      <span>
                        DISTANCE
                      </span>

                      <strong>

                        {bestRoute.distance_nm !==
                          null &&
                        bestRoute.distance_nm !==
                          undefined

                          ? `${Number(
                              bestRoute.distance_nm
                            ).toLocaleString()} NM`

                          : "N/A"}

                      </strong>

                    </div>


                    <div>

                      <span>
                        TRANSIT TIME
                      </span>

                      <strong>

                        {bestRoute.estimated_days !==
                          null &&
                        bestRoute.estimated_days !==
                          undefined

                          ? `${bestRoute.estimated_days} days`

                          : "N/A"}

                      </strong>

                    </div>


                    <div>

                      <span>
                        DEPARTURE
                      </span>

                      <strong>
                        {
                          bestRoute
                            .departure_port
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        ARRIVAL
                      </span>

                      <strong>
                        {
                          bestRoute
                            .arrival_port
                        }
                      </strong>

                    </div>

                  </div>

                </div>

              </div>


              {/* MATCHING ROUTES */}

              <div className="matching-section">

                <div className="matching-header">

                  <div>
                    <span>
                      AVAILABLE OPTIONS
                    </span>

                    <h3>
                      All Matching Routes
                    </h3>

                    <p>
                      Compare the available vessels,
                      route distance and estimated transit time.
                    </p>
                  </div>

                  <div className="route-count">
                    {totalRoutes}
                    {" "}
                    {totalRoutes === 1 ? "ROUTE" : "ROUTES"}
                  </div>

                </div>


                <div
                  className="route-grid"
                  style={{
                    gap: "18px"
                  }}
                >

                  {matchingRoutes.map(
                    (route, index) => {

                      const isBest =
                        route.route_id ===
                        bestRoute.route_id;

                      const routeRank =
                        route.rank ?? index + 1;

                      const cargoMatch =
                        route.cargo_match === true;

                      return (

                        <div
                          key={
                            route.route_id ??
                            index
                          }
                          className={
                            isBest
                              ? "route-option best-option"
                              : "route-option"
                          }
                          style={{
                            position: "relative",
                            overflow: "hidden",
                            padding: "22px",
                            borderRadius: "20px",
                            border: isBest
                              ? "1.5px solid rgba(16,185,129,0.55)"
                              : "1px solid rgba(148,163,184,0.18)",
                            background: isBest
                              ? "linear-gradient(145deg, rgba(16,185,129,0.10), rgba(59,130,246,0.07))"
                              : "rgba(255,255,255,0.025)",
                            boxShadow: isBest
                              ? "0 12px 30px rgba(16,185,129,0.09)"
                              : "none",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease"
                          }}
                        >

                          {isBest && (
                            <div
                              className="best-badge"
                              style={{
                                position: "absolute",
                                top: "14px",
                                right: "14px",
                                padding: "6px 10px",
                                borderRadius: "999px",
                                fontSize: "9px",
                                fontWeight: 900,
                                letterSpacing: "0.8px",
                                background: "rgba(16,185,129,0.16)",
                                border: "1px solid rgba(16,185,129,0.28)"
                              }}
                            >
                              🥇 BEST MATCH
                            </div>
                          )}


                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                              paddingRight: isBest ? "105px" : "0",
                              marginBottom: "16px"
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 900,
                                letterSpacing: "1.1px",
                                opacity: 0.62
                              }}
                            >
                              {isBest
                                ? "AI TOP RECOMMENDATION"
                                : `ALTERNATIVE ${index + 1}`}
                            </span>

                            <span
                              style={{
                                padding: "5px 9px",
                                borderRadius: "999px",
                                fontSize: "9px",
                                fontWeight: 800,
                                border: "1px solid rgba(148,163,184,0.18)",
                                background: "rgba(255,255,255,0.035)"
                              }}
                            >
                              RANK #{routeRank}
                            </span>
                          </div>


                          <h4
                            style={{
                              fontSize: "21px",
                              margin: "0 0 12px",
                              lineHeight: 1.25
                            }}
                          >
                            🚢{" "}
                            {route.recommended_ship}
                          </h4>


                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "9px",
                              marginBottom: "18px",
                              fontSize: "14px"
                            }}
                          >
                            <strong>
                              {route.origin}
                            </strong>

                            <span
                              style={{
                                opacity: 0.55,
                                fontSize: "18px"
                              }}
                            >
                              →
                            </span>

                            <strong>
                              {route.destination}
                            </strong>
                          </div>


                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(2, minmax(0, 1fr))",
                              gap: "10px",
                              marginBottom: "14px"
                            }}
                          >

                            <div
                              style={{
                                padding: "13px",
                                borderRadius: "14px",
                                background: "rgba(255,255,255,0.035)",
                                border: "1px solid rgba(148,163,184,0.14)"
                              }}
                            >
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  letterSpacing: "1px",
                                  opacity: 0.58
                                }}
                              >
                                DISTANCE
                              </span>

                              <strong
                                style={{
                                  display: "block",
                                  marginTop: "6px",
                                  fontSize: "16px"
                                }}
                              >
                                {route.distance_nm !==
                                  null &&
                                route.distance_nm !==
                                  undefined
                                  ? `${Number(
                                      route.distance_nm
                                    ).toLocaleString()} NM`
                                  : "N/A"}
                              </strong>
                            </div>


                            <div
                              style={{
                                padding: "13px",
                                borderRadius: "14px",
                                background: "rgba(255,255,255,0.035)",
                                border: "1px solid rgba(148,163,184,0.14)"
                              }}
                            >
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  letterSpacing: "1px",
                                  opacity: 0.58
                                }}
                              >
                                TRANSIT TIME
                              </span>

                              <strong
                                style={{
                                  display: "block",
                                  marginTop: "6px",
                                  fontSize: "16px"
                                }}
                              >
                                {route.estimated_days !==
                                  null &&
                                route.estimated_days !==
                                  undefined
                                  ? `${route.estimated_days} days`
                                  : "N/A"}
                              </strong>
                            </div>

                          </div>


                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px",
                              padding: "11px 13px",
                              borderRadius: "13px",
                              marginBottom: "14px",
                              background: "rgba(59,130,246,0.055)",
                              border: "1px solid rgba(59,130,246,0.12)"
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "0.8px",
                                opacity: 0.65
                              }}
                            >
                              VESSEL SPEED
                            </span>

                            <strong
                              style={{
                                fontSize: "13px"
                              }}
                            >
                              ⚡ {route.speed} knots
                            </strong>
                          </div>


                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(3, minmax(0, 1fr))",
                              gap: "8px"
                            }}
                          >

                            <div>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  letterSpacing: "0.8px",
                                  opacity: 0.52
                                }}
                              >
                                CARGO
                              </span>

                              <strong
                                style={{
                                  display: "block",
                                  marginTop: "4px",
                                  fontSize: "11px"
                                }}
                              >
                                {cargoMatch
                                  ? "✓ MATCH"
                                  : "REVIEW"}
                              </strong>
                            </div>


                            <div>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  letterSpacing: "0.8px",
                                  opacity: 0.52
                                }}
                              >
                                CONTAINERS
                              </span>

                              <strong
                                style={{
                                  display: "block",
                                  marginTop: "4px",
                                  fontSize: "11px"
                                }}
                              >
                                {route.containers}
                              </strong>
                            </div>


                            <div>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  letterSpacing: "0.8px",
                                  opacity: 0.52
                                }}
                              >
                                IMO
                              </span>

                              <strong
                                style={{
                                  display: "block",
                                  marginTop: "4px",
                                  fontSize: "11px"
                                }}
                              >
                                {route.imo_number}
                              </strong>
                            </div>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>

            </>

          )}

        </section>




      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <div className="footer-grid">


          <div className="footer-brand">

            <div className="footer-logo">
              ⚓
            </div>

            <div>

              <h2>
                MaritimeAI
              </h2>

              <p>
                AI-powered maritime intelligence
                platform for smarter shipping and
                better decisions.
              </p>

            </div>

          </div>


          <div className="footer-column">

            <h3>
              PLATFORM
            </h3>

            <p
              onClick={() =>
                scrollToSection(
                  "dashboard",
                  "dashboard"
                )
              }
            >
              Dashboard
            </p>

            <p
              onClick={() =>
                scrollToSection(
                  "route-analysis",
                  "route"
                )
              }
            >
              Route Analysis
            </p>

            <p
              onClick={() =>
                scrollToSection(
                  "fleet-intelligence",
                  "fleet"
                )
              }
            >
              Fleet Intelligence
            </p>

          </div>


          <div className="footer-column">

            <h3>
              TECHNOLOGY
            </h3>

            <p>
              AI / Machine Learning
            </p>

            <p>
              Route Optimization
            </p>

            <p>
              Vessel Intelligence
            </p>

          </div>


          <div className="footer-column">

            <h3>
              CONTACT
            </h3>

            <p>
              info@maritimeai.com
            </p>

            <p>
              +1 (555) 123-4567
            </p>

            <div className="socials">

              <span>
                in
              </span>

              <span>
                𝕏
              </span>

              <span>
                ✉
              </span>

            </div>

          </div>

        </div>


        <div className="copyright">

          © 2026 MaritimeAI.
          All rights reserved.

        </div>

      </footer>

    </div>
  );
}

export default App;