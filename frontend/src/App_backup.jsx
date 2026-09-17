import { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";

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
        "http://127.0.0.1:8000/api/quotations/generate",
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
            Route Analysis
          </button>


          <button
            className={
              activeTab === "fleet"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() =>
              scrollToSection(
                "fleet-intelligence",
                "fleet"
              )
            }
          >
            Fleet Intelligence
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
            Analyze maritime routes,
            compare available vessels and
            receive intelligent recommendations
            for your shipment.
          </p>


          <div className="stats-container">

            <div className="stat-card">

              <div className="stat-icon blue">
                ⚓
              </div>

              <div>

                <strong>
                  47+
                </strong>

                <span>
                  Routes Available
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
          MAIN
      ===================================================== */}

      <main className="main-content">


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
                FLEET INTELLIGENCE
              </span>

              <h2>
                Intelligent Vessel Selection
              </h2>

              <p>
                AI-powered route and vessel
                recommendations based on your
                shipment requirements.
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
                Ready for Fleet Analysis
              </h3>

              <p>
                Analyze a shipment above to
                view intelligent vessel
                recommendations.
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
                    <span
                      style={{
                        letterSpacing: "1px"
                      }}
                    >
                      WHY THIS ROUTE?
                    </span>
                    <p>
                      {result.recommendation?.recommendation_reason}
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
                      Compare vessel speed,
                      distance, transit time
                      and route details.
                    </p>

                  </div>


                  <div className="route-count">

                    {totalRoutes}
                    {" "}
                    ROUTE
                    {totalRoutes !== 1
                      ? "S"
                      : ""}

                  </div>

                </div>


                <div className="route-grid">

                  {matchingRoutes.map(
                    (route, index) => {

                      const isBest =
                        route.route_id ===
                        bestRoute.route_id;

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
                        >


                          {isBest && (

                            <div className="best-badge">
                              🥇 BEST ROUTE
                            </div>

                          )}


                          <div className="route-option-top">

                            <span>

                              {isBest
                                ? "TOP RECOMMENDATION"
                                : `OPTION ${
                                    index + 1
                                  }`}

                            </span>


                            <strong>
                              ⚡{" "}
                              {route.speed}
                              {" "}
                              knots
                            </strong>

                          </div>


                          <h4>

                            🚢{" "}

                            {
                              route
                                .recommended_ship
                            }

                          </h4>


                          <div className="route-path">

                            <span>
                              {route.origin}
                            </span>

                            <b>
                              →
                            </b>

                            <span>
                              {route.destination}
                            </span>

                          </div>


                          {/* DISTANCE + TIME */}

                          <div className="route-timing">

                            <div>

                              <span>
                                DISTANCE
                              </span>

                              <strong>

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


                            <div>

                              <span>
                                EST. TRANSIT
                              </span>

                              <strong>

                                {route.estimated_days !==
                                  null &&
                                route.estimated_days !==
                                  undefined

                                  ? `${route.estimated_days} days`

                                  : "N/A"}

                              </strong>

                            </div>

                          </div>


                          {/* DETAILS */}

                          <div className="route-details-grid">

                            <div>

                              <span>
                                CARGO
                              </span>

                              <strong>
                                {
                                  route
                                    .cargo_type
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                CONTAINERS
                              </span>

                              <strong>
                                {
                                  route
                                    .containers
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                IMO
                              </span>

                              <strong>
                                {
                                  route
                                    .imo_number
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                ROUTE SCORE
                              </span>

                              <strong>
                                {
                                  route
                                    .recommendation_score
                                }
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


        {/* =================================================
            RECENT SEARCHES
        ================================================= */}

        <section className="recent-section">

          <div className="recent-header">

            <div>

              <span>
                RECENT ACTIVITY
              </span>

              <h2>
                Recent Searches
              </h2>

            </div>


            {recentSearches.length > 0 && (

              <button
                className="clear-history"
                onClick={clearHistory}
              >
                Clear History
              </button>

            )}

          </div>


          {recentSearches.length === 0 ? (

            <div className="empty-history">

              Your recent route searches
              will appear here.

            </div>

          ) : (

            <div className="recent-grid">

              {recentSearches.map(
                (search, index) => (

                  <div
                    className="recent-card"
                    key={index}
                    onClick={() =>
                      useRecentSearch(search)
                    }
                  >

                    <div className="recent-route">

                      <strong>
                        {search.origin}
                      </strong>

                      <span>
                        →
                      </span>

                      <strong>
                        {search.destination}
                      </strong>

                    </div>


                    <p>

                      {search.cargoType}
                      {" • "}
                      {search.containers}
                      {" Containers"}

                    </p>


                    <div
                      className={
                        search.status ===
                        "found"

                          ? "recent-status found"

                          : "recent-status not-found"
                      }
                    >

                      ●{" "}

                      {search.status ===
                      "found"

                        ? "Route Found"

                        : "Route Not Found"}

                    </div>

                  </div>

                )
              )}

            </div>

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