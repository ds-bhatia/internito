import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../slices/authSlice";
import "./TopBar.css";

function TopBar() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // Refs for hamburger and nav
  const hamburgerRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event) {
      if (
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target) &&
        navRef.current &&
        !navRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:8000"
        }/api/logout`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="topbar">
      <div className="logos">
        <div className="csesLogo">
          <a
            href="https://www.csesnitw.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/csesLogo.png"
              alt="CSES Logo"
              style={{ width: "40px", height: "auto", marginLeft: "-7px" }}
            />
          </a>
        </div>
        <div
          className="logo"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/search")}
        >
          <h1>
            inter<span className="logo-n">N</span>ito
          </h1>
        </div>
      </div>

      {/* Hamburger icon */}
      <div
        className={`hamburger${menuOpen ? " open" : ""}`}
        onClick={toggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        tabIndex={0}
        role="button"
        ref={hamburgerRef}
      >
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <nav className={`nav-links ${menuOpen ? "open" : ""}`} ref={navRef}>
        <ul>
          {!isLoggedIn ? (
            <>
              <li>
                <NavLink
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Log In
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <span>
                  {loading ? null : user && user.firstName ? (
                    <NavLink
                      to="/user"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => (isActive ? "active" : "")}
                    >
                      {({ isActive }) =>
                        isActive ? (
                          <>Hello {user.firstName}!</>
                        ) : (
                          <>
                            Hello <strong>{user.firstName}</strong>!
                          </>
                        )
                      }
                    </NavLink>
                  ) : (
                    ""
                  )}
                </span>
              </li>
              {user ? (
                <li>
                  <span>
                    <NavLink
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => (isActive ? "active" : "")}
                    >
                      Admin
                    </NavLink>
                  </span>
                </li>
              ) : (
                ""
              )}
              <li>
                <NavLink
                  to="/search"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Search Companies
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/experiences"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Experiences
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/addExperiences"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Write
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  About
                </NavLink>
              </li>
              <li className="feedback-logout-group">
                <NavLink
                  to="/feedback"
                  onClick={() => setMenuOpen(false)}
                  className="feedback-button"
                >
                  Feedback
                </NavLink>
                <button onClick={handleLogout} className="logout-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 17l5-5m0 0l-5-5m5 5H9m4 5v1a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v1"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default TopBar;
