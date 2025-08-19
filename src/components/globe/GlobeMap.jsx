// GlobeMap.jsx
import React, { useRef, useEffect, useState } from "react";
import Globe from "globe.gl";
import * as d3 from "d3";
import * as THREE from "three";
import "./GlobeMap.css";
import countries from "./countries.json";

const CASES_PER_POINT = 10000; // 1 point = 10k cases
const FRAME_DURATION = 500;    // ms per frame
const POINT_SIZE = 1.2;        // base particle size
const MIN_POINTS = 2;          // at least this many per country

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
  const globeInstance = useRef(null);

  const [dataFrames, setDataFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [allPoints, setAllPoints] = useState([]); // ✅ accumulate points

  // --- init globe + fetch data ----------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      const raw = await d3.csv("/data/owid-covid-data.csv");
      const framesMap = {}; // {date: [{lat,lng,value,country}]}

      for (const row of raw) {
        const date = row.date;
        if (!date) continue;
        if (!framesMap[date]) framesMap[date] = [];

        const newCases = +row.new_cases || 0;
        if (newCases <= 0) continue;

        // ✅ normalize name
        let key = row.location;
        if (countryNameMap[key]) key = countryNameMap[key];

        const coords = countries[key];
        if (!coords) continue;

        framesMap[date].push({
          lat: coords.lat,
          lng: coords.lng,
          value: newCases,
          country: key
        });
      }

      const sorted = Object.entries(framesMap)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, points]) => ({ date, points }));

      if (isMounted) setDataFrames(sorted);
    }

    const globe = Globe()(globeEl.current)
      .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
      .bumpImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
      .backgroundColor("rgba(0,0,0,0)")
      .showGlobe(true);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;
    globeInstance.current = globe;

    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => res.json())
      .then((geo) => {
        globe
          .polygonsData(geo.features)
          .polygonCapColor(() => "rgba(255,255,255,0.05)")
          .polygonSideColor(() => "rgba(0,0,0,0.15)")
          .polygonStrokeColor(() => "#ffffff")
          .polygonLabel((d) => `<b>${d.properties.name}</b>`);
      });

    fetchData();
    return () => { isMounted = false; };
  }, []);

  // --- autoplay timer --------------------------------------------------
  useEffect(() => {
    if (!playing || dataFrames.length === 0) return;
    const id = setInterval(() => {
      setCurrentFrame((f) => (f < dataFrames.length - 1 ? f + 1 : f));
    }, FRAME_DURATION);
    return () => clearInterval(id);
  }, [playing, dataFrames]);

  // --- accumulate points instead of replacing --------------------------
  useEffect(() => {
    if (dataFrames.length === 0 || !globeInstance.current) return;

    const frame = dataFrames[currentFrame];
    if (!frame) return;

    const newPoints = [];

    frame.points.forEach((p) => {
      const numPoints = Math.max(MIN_POINTS, Math.floor(p.value / CASES_PER_POINT));
      for (let i = 0; i < numPoints; i++) {
        newPoints.push({
          lat: p.lat + (Math.random() - 0.5) * 0.5, // jitter
          lng: p.lng + (Math.random() - 0.5) * 0.5,
          size: POINT_SIZE,
          value: p.value
        });
      }
    });

    // ✅ Add to existing points, don’t replace
    setAllPoints((prev) => [...prev, ...newPoints]);
  }, [currentFrame, dataFrames]);

  // --- render all accumulated points -----------------------------------
  useEffect(() => {
    const globe = globeInstance.current;
    if (!globe) return;

    globe
      .pointsData(allPoints)
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointAltitude((d) => 0.05 + Math.log1p(d.value) * 0.002)
      .pointRadius((d) => d.size)
      .pointColor(() => "rgba(72, 136, 219, 0.85)")
      .pointResolution(12);
  }, [allPoints]);

  // --- UI ---------------------------------------------------
  const canRewind = currentFrame > 0;
  const canFwd = dataFrames.length > 0 && currentFrame < dataFrames.length - 1;
  const currentDate = dataFrames[currentFrame]?.date || "--";

  return (
    <div className="globe-map-wrapper">
      <div className="globe-text-container">
        <h1 className="globe-title">Outbreak Timeline: COVID-19</h1>
        <p className="globe-subtitle">
          Now using floating scatter points — higher + more points = more cases.
        </p>
      </div>

      <div className="globe-map-container" ref={globeEl} />

      <div className="controls">
        <button onClick={() => setCurrentFrame((f) => Math.max(f - 1, 0))} disabled={!canRewind}>⏪</button>
        <button onClick={() => setPlaying((p) => !p)}>{playing ? "⏸ Pause" : "▶ Play"}</button>
        <button onClick={() => setCurrentFrame((f) => Math.min(f + 1, dataFrames.length - 1))} disabled={!canFwd}>⏩</button>
        <span className="date-label">{currentDate}</span>
      </div>
    </div>
  );
}
