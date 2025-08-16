import React from "react";
import "./Navbar.css";


export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="https://www.freepnglogos.com/uploads/fox-png/image-fox-bouboum-wiki-0.png" alt="Logo" className="logo" />
        <span className="website-name">PandemicView</span>
      </div>
      <div className="navbar-buttons">
        <button>Home</button>
        <button>About</button>
        <button>Features</button>
        <button>Contact</button>
      </div>
    </nav>
  );
}
