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
        "http://127.0.0.1:8000/api/routes/analyze",
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

      setResult(data);

      const newSearch = {
        origin: origin.trim(),
        destination: destination.trim(),
        cargoType: cargoType.trim(),
        containers: Number(containers),
        status: data.status,
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

      if (data.status === "found") {
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


              {/* AI + VESSEL */}

              <div className="fleet-grid">


                {/* AI CARD */}

                <div className="fleet-card">

                  <div className="fleet-card-heading">

                    <div>

                      <span>
                        AI ANALYSIS
                      </span>

                      <h3>
                        Route Intelligence
                      </h3>

                    </div>

                    <div className="fleet-card-icon">
                      🤖
                    </div>

                  </div>


                  <div className="progress-text">

                    <span>
                      Overall route match
                    </span>

                    <strong>
                      {matchScore}%
                    </strong>

                  </div>


                  <div className="progress-track">

                    <div
                      className="progress-value"
                      style={{
                        width:
                          `${matchScore}%`,
                      }}
                    ></div>

                  </div>


                  <div className="analysis-points">

                    <div>

                      <span>
                        Cargo Compatibility
                      </span>

                      <strong>
                        {
                          result
                            .recommendation
                            ?.cargo_match
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Container Difference
                      </span>

                      <strong>
                        {
                          result
                            .recommendation
                            ?.container_difference
                        }
                      </strong>

                    </div>

                  </div>


                  <div className="recommendation-reason">

                    <span>
                      Why this route?
                    </span>

                    <p>
                      {
                        result
                          .recommendation
                          ?.recommendation_reason
                      }
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