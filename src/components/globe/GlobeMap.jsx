import React, { useRef, useEffect, useState } from "react";
import Globe from "globe.gl";
import "./GlobeMap.css";

export default function GlobeMap() {
  const globeEl = useRef();
  const globeInstance = useRef(null); // store globe instance
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const points = [
    { lat: 28.6139, lng: 77.209, city: "Delhi", cases: 1234 },
    { lat: 40.7128, lng: -74.006, city: "New York", cases: 4321 },
  ];

  useEffect(() => {
    const globe = Globe()(globeEl.current)
      .globeImageUrl(
        "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
      )
      .bumpImageUrl(
        "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
      )
      .backgroundColor("rgba(0,0,0,0)")
      .pointsData(points)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor(() => "#ff4d4d")
      .pointAltitude(0.02)
      .pointRadius(0.3)
      .onPointHover((point) => setHoveredPoint(point));

    globeInstance.current = globe; // store instance

    // Fetch GeoJSON for countries
    fetch(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    )
      .then((res) => res.json())
      .then((countries) => {
        globe
          .polygonsData(countries.features)
          .polygonCapColor(() => "rgba(255,255,255,0.05)")
          .polygonSideColor(() => "rgba(0,0,0,0.2)")
          .polygonStrokeColor(() => "#ffffff")
          .polygonLabel((d) => `<b>${d.properties.name}</b>`);
      });

    // Track mouse for tooltip
    const handleMouseMove = (e) =>
      setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);

    // Auto-rotation using globe instance
    let frame;
    const rotateGlobe = () => {
      if (globeInstance.current) {
        globeInstance.current.controls().autoRotate = true; // enable Three.js OrbitControls auto-rotate
        globeInstance.current.controls().autoRotateSpeed = 0.3; // adjust speed
      }
      frame = requestAnimationFrame(rotateGlobe);
    };
    rotateGlobe();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", handleMouseMove);
      globeEl.current?.remove();
    };
  }, []);

  return (
    <div className="globe-map-wrapper">
      <div className="globe-text-container">
        <h1 className="globe-title">Outbreaks History</h1>
        <p className="globe-subtitle">
          Explore outbreak data across the globe in real-time
        </p>
      </div>
      <div className="globe-map-container" ref={globeEl} />
      {hoveredPoint && (
        <div
          className="tooltip"
          style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
        >
          <strong>{hoveredPoint.city}</strong>
          {hoveredPoint.cases && `: ${hoveredPoint.cases} cases`}
        </div>
      )}
    </div>
  );
}
