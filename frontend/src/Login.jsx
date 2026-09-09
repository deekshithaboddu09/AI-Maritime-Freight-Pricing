import { useState } from "react";
import "./Login.css";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getUsers = () => {
    try {
      const savedUsers = localStorage.getItem("maritimeUsers");
      return savedUsers ? JSON.parse(savedUsers) : [];
    } catch {
      return [];
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const users = getUsers();

    const user = users.find(
      (item) =>
        item.email?.toLowerCase() ===
          email.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      setError(
        "Invalid email or password. Please register first."
      );
      return;
    }

    localStorage.setItem(
      "maritimeLoggedIn",
      "true"
    );

    localStorage.setItem(
      "maritimeCurrentUser",
      JSON.stringify(user)
    );

    onLogin(user);
  };

  const handleRegister = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all registration details.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    const users = getUsers();

    const alreadyExists = users.some(
      (item) =>
        item.email?.toLowerCase() ===
        email.trim().toLowerCase()
    );

    if (alreadyExists) {
      setError(
        "An account with this email already exists."
      );
      return;
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    const updatedUsers = [
      ...users,
      newUser,
    ];

    localStorage.setItem(
      "maritimeUsers",
      JSON.stringify(updatedUsers)
    );

    localStorage.setItem(
      "maritimeLoggedIn",
      "true"
    );

    localStorage.setItem(
      "maritimeCurrentUser",
      JSON.stringify(newUser)
    );

    onLogin(newUser);
  };

  const switchMode = () => {
    setMode(
      mode === "login"
        ? "register"
        : "login"
    );

    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  return (
    <div className="login-page">

      <div className="login-background"></div>

      <div className="login-overlay"></div>

      <div className="login-container">

        <div className="login-card">

          {/* BRAND */}

          <div className="login-brand">

            <div className="login-logo">
              ⚓
            </div>

            <h1>
              MaritimeAI
            </h1>

            <p>
              INTELLIGENT SHIPPING PLATFORM
            </p>

          </div>


          {/* HEADING */}

          <div className="login-heading">

            <h2>
              {mode === "login"
                ? "Welcome Back"
                : "Create Your Account"}
            </h2>

            <p>
              {mode === "login"
                ? "Sign in to access your maritime intelligence dashboard."
                : "Create your account to start using MaritimeAI."}
            </p>

          </div>


          {/* FORM */}

          <form
            onSubmit={
              mode === "login"
                ? handleLogin
                : handleRegister
            }
          >

            {/* NAME */}

            {mode === "register" && (

              <div className="login-field">

                <label>
                  Full Name
                </label>

                <div className="login-input">

                  <span>
                    👤
                  </span>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />

                </div>

              </div>

            )}


            {/* EMAIL */}

            <div className="login-field">

              <label>
                Email Address
              </label>

              <div className="login-input">

                <span>
                  ✉
                </span>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="login-field">

              <label>
                Password
              </label>

              <div className="login-input">

                <span>
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={
                    mode === "register"
                      ? "Minimum 6 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "◉"
                    : "◌"}
                </button>

              </div>

            </div>


            {/* ERROR */}

            {error && (

              <div className="login-error">
                {error}
              </div>

            )}


            {/* SUCCESS */}

            {success && (

              <div className="login-success">
                {success}
              </div>

            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="login-button"
            >

              {mode === "login"
                ? "Sign In"
                : "Create Account"}

              <span>
                →
              </span>

            </button>

          </form>


          {/* SWITCH */}

          <div className="account-switch">

            <span>
              {mode === "login"
                ? "New to MaritimeAI?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {mode === "login"
                ? "Create Account"
                : "Sign In"}
            </button>

          </div>


          {/* SECURITY */}

          <div className="login-security">

            <span>
              ✓
            </span>

            Secure Maritime Intelligence Access

          </div>


          {/* FOOTER */}

          <div className="login-footer">

            <span>
              AI-Powered Route Intelligence
            </span>

            <span>
              •
            </span>

            <span>
              System Online
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;