import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Background from "./components/Background";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import GlobeMap from "./components/globe/GlobeMap";
import Dashboard from "./components/globe/Dashboard";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Background />
        <Navbar />

        <Routes>
          {/* Main page with globe */}
          <Route
            path="/"
            element={
              <div className="globe-wrapper">
                <GlobeMap />
              </div>
            }
          />

          {/* Dashboard route */}
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
