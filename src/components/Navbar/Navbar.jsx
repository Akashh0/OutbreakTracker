import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src="https://www.freepnglogos.com/uploads/fox-png/image-fox-bouboum-wiki-0.png"
          alt="Logo"
          className="logo"
        />
        <span className="website-name">PandemicView</span>
      </div>
      <div className="navbar-buttons">
        <Link to="/">
          <button>Home</button>
        </Link>
        <Link to="/about">
          <button>About</button>
        </Link>
        <Link to="/features">
          <button>Features</button>
        </Link>
        <Link to="/contact">
          <button>Contact</button>
        </Link>
      </div>
    </nav>
  );
}
