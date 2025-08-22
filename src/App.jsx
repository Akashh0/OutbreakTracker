import React from "react";
import Background from "./components/Background";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import GlobeMap from "./components/globe/GlobeMap";
import Dashboard from "./components/globe/Dashboard";

function App() {
  return (
    <div className="app-container">
      <Background />
      <Navbar />
      {/* Wrap the globe in a fixed-width container */}
      <div className="globe-wrapper">
        <GlobeMap />
      </div>
      <Dashboard />
    </div>
  );
}

export default App;
