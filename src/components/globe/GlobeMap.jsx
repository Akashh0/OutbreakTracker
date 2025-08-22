import React, { useRef, useEffect, useState } from "react";
import Globe from "globe.gl";
import * as d3 from "d3";
import * as THREE from "three";
import "./GlobeMap.css";
import countries from "./countries.json";

// 🔑 Normalize OWID names → countries.json keys
const countryNameMap = {
  "United States": "United States of America",
  "South Korea": "Korea, Republic of",
  "North Korea": "Korea, Democratic People's Republic of",
  "Democratic Republic of Congo": "Congo, The Democratic Republic of the",
  "Republic of Congo": "Congo",
  "Czechia": "Czech Republic",
  "Myanmar": "Burma",
  "Eswatini": "Swaziland",
  "Cabo Verde": "Cape Verde",
  "North Macedonia": "Macedonia, The Former Yugoslav Republic of",
  "Syria": "Syrian Arab Republic",
  "Taiwan": "Taiwan, Province of China",
  "Laos": "Lao People's Democratic Republic"
};

export default function GlobeMap() {
  const globeEl = useRef(null);
  const [totals, setTotals] = useState({});
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });
  const globeRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const raw = await d3.csv("/data/owid-covid-data.csv");

      // 🌍 aggregate *total* cases per country
      const totals = {};
      for (const row of raw) {
        const newCases = +row.new_cases || 0;
        if (newCases <= 0) continue;

        let key = row.location;
        if (countryNameMap[key]) key = countryNameMap[key];

        const coords = countries[key];
        if (!coords) continue;

        if (!totals[key]) {
          totals[key] = { lat: coords.lat, lng: coords.lng, cases: 0 };
        }
        totals[key].cases += newCases;
      }
      setTotals(totals);
    }

    // --- Globe Setup ---
    const globe = Globe()(globeEl.current)
      .globeImageUrl(
        "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
      )
      .bumpImageUrl(
        "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
      )
      .backgroundColor("rgba(0,0,0,0)");

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;
    globeRef.current = globe;

    // Country outlines
    fetch(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    )
      .then(res => res.json())
      .then(geo => {
        globe
          .polygonsData(geo.features)
          .polygonCapColor(d =>
            d === hoveredCountry ? "rgba(255,165,0,0.8)" : "rgba(255,255,255,0.05)"
          )
          .polygonSideColor(() => "rgba(0,0,0,0.15)")
          .polygonStrokeColor(() => "#ffffff")
          .onPolygonHover(d => {
            setHoveredCountry(d || null);

            if (d && totals[d.properties.name]) {
              // project lat/lng to screen position
              const { lat, lng } = totals[d.properties.name];
              const coords = globe.getCoords(lat, lng);
              const vec = new THREE.Vector3(...coords).project(
                globe.camera()
              );
              const x = (vec.x * 0.5 + 0.5) * globe.renderer().domElement.clientWidth;
              const y = (-vec.y * 0.5 + 0.5) * globe.renderer().domElement.clientHeight;

              setTooltipPos({ x, y, visible: true });
            } else {
              setTooltipPos({ x: 0, y: 0, visible: false });
            }
          });
      });

    fetchData();
  }, []);

  return (
    <div className="globe-map-wrapper">
      <div className="globe-text-container">
        <h1 className="globe-title">COVID-19 Outbreak Globe</h1>
        <p className="globe-subtitle">Track the global spread of COVID-19 through this interactive 3D globe. Hover over any country to instantly view its current case count. A centralized dashboard provides total worldwide statistics for deeper insights. Simple, clear, and data-driven and designed to help you understand the pandemic at a glance.</p>
        <br></br>
        <p className="globe-subtitle">A geospatial visualization of COVID-19 cases across countries. Designed to present global outbreak data with clarity and precision.</p>
      </div>
      <div className="globe-map-container" ref={globeEl} />
      {hoveredCountry && tooltipPos.visible && (
        <div
          className="globe-tooltip"
          style={{
            left: tooltipPos.x + "px",
            top: tooltipPos.y + "px",
            position: "absolute"
          }}
        >
          <b>{hoveredCountry.properties.name}</b>
          <br />
          Cases: {totals[hoveredCountry.properties.name]?.cases || "N/A"}
        </div>
      )}
    </div>
  );
}
