import React, { useRef, useEffect, useState } from "react";
import Globe from "globe.gl";
import * as d3 from "d3";
import "./GlobeMap.css";
import { geocodeLocation } from "../../components/geocoder"; // your geocoder.js

export default function GlobeMap() {
  const globeEl = useRef();
  const globeInstance = useRef();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dataFrames, setDataFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frameDuration = 500; // ms per frame

  // Cache geocoded results to avoid repeated API calls
  const geoCache = {};

  useEffect(() => {
    async function fetchData() {
      const data = await d3.csv("/data/owid-covid-data.csv");
      const frames = {};

      for (const row of data) {
        const date = row.date;
        if (!frames[date]) frames[date] = [];

        if (row.new_cases && +row.new_cases > 0) {
          let lat = row.latitude ? +row.latitude : null;
          let lng = row.longitude ? +row.longitude : null;

          // If no coordinates, use geocoder with cache
          if (!lat || !lng) {
            if (geoCache[row.location]) {
              ({ lat, lng } = geoCache[row.location]);
            } else {
              const coords = await geocodeLocation(row.location);
              if (coords) {
                lat = coords.lat;
                lng = coords.lng;
                geoCache[row.location] = coords;
              }
            }
          }

          if (lat && lng) {
            frames[date].push({
              lat,
              lng,
              country: row.location,
              cases: +row.new_cases
            });
          }
        }
      }

      const sorted = Object.entries(frames)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, locs]) => ({ date, locations: locs }));

      setDataFrames(sorted);
    }

    fetchData();

    const globe = Globe()(globeEl.current)
      .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
      .bumpImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
      .backgroundColor("rgba(0,0,0,0)")
      .showGlobe(true)
      .onPointHover(p => setHoveredPoint(p));

    globeInstance.current = globe;

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;

    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then(res => res.json())
      .then(countries => {
        globe.polygonsData(countries.features)
          .polygonCapColor(() => "rgba(255,255,255,0.05)")
          .polygonSideColor(() => "rgba(0,0,0,0.2)")
          .polygonStrokeColor(() => "#ffffff")
          .polygonLabel(d => `<b>${d.properties.name}</b>`);
      });

    window.addEventListener("mousemove", e => setMousePos({ x: e.clientX, y: e.clientY }));

    return () => {
      window.removeEventListener("mousemove", () => {});
      globeEl.current?.remove();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (playing && dataFrames.length) {
      interval = setInterval(() => {
        setCurrentFrame(f => Math.min(f + 1, dataFrames.length - 1));
      }, frameDuration);
    }
    return () => clearInterval(interval);
  }, [playing, dataFrames]);

  useEffect(() => {
    if (dataFrames[currentFrame] && globeInstance.current) {
      globeInstance.current.pointsData(dataFrames[currentFrame].locations);
    }
  }, [currentFrame, dataFrames]);

  return (
    <div className="globe-map-wrapper">
      <div className="globe-text-container">
        <h1 className="globe-title">Outbreak Timeline: COVID-19</h1>
        <p className="globe-subtitle">
          Watch the spread unfold—play, pause, rewind, or scrub through dates.
        </p>
      </div>

      <div className="globe-map-container" ref={globeEl} />

      <div className="controls">
        <button
          onClick={() => setCurrentFrame(f => Math.max(f - 1, 0))}
          disabled={currentFrame === 0}
        >
          ⏪
        </button>
        <button onClick={() => setPlaying(p => !p)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => setCurrentFrame(f => Math.min(f + 1, dataFrames.length - 1))}
          disabled={currentFrame === dataFrames.length - 1}
        >
          ⏩
        </button>
        <span className="date-label">
          {dataFrames[currentFrame]?.date || "--"}
        </span>
      </div>

      {hoveredPoint && (
        <div
          className="tooltip"
          style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
        >
          <strong>{hoveredPoint.country}</strong>: {hoveredPoint.cases} new cases
        </div>
      )}
    </div>
  );
}
