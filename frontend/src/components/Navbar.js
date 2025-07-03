import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  return (
    <nav className="navbar-glass">
      <div className="navbar-logo">ConnectFlow</div>
      <div className="navbar-links">
        <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>Login</Link>
        <Link to="/register" className={location.pathname === "/register" ? "active" : ""}>Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
