// GlobeMap.jsx
import React, { useRef, useEffect, useState } from "react";
import Globe from "globe.gl";
import * as d3 from "d3";
import "./GlobeMap.css";
import countries from "./countries.json"; // local country centroids (lat/lng)

// 1 hex = N cases (lower = more detail, higher = less detail)
const CASES_PER_UNIT = 50;
const FRAME_DURATION = 500;

export default function GlobeMap() {
  const globeEl = useRef(null);
  const globeInstance = useRef(null);

  const [dataFrames, setDataFrames] = useState([]); // [{date, points:[{lat,lng,weight},...]}]
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  // --- mount / init globe + data ------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      const raw = await d3.csv("/data/owid-covid-data.csv");
      const framesMap = {}; // date -> array of case points

      for (const row of raw) {
        const date = row.date;
        if (!date) continue;

        if (!framesMap[date]) framesMap[date] = [];

        const newCases = +row.new_cases || 0;
        if (newCases <= 0) continue;

        // prefer row lat/lng if present; else fallback to countries.json
        let lat = row.latitude ? +row.latitude : null;
        let lng = row.longitude ? +row.longitude : null;

        if ((!lat || !lng) && countries[row.location]) {
          lat = countries[row.location].lat;
          lng = countries[row.location].lng;
        }

        if (lat == null || lng == null) continue;

        // push one weighted point instead of thousands of dots
        framesMap[date].push({
          lat,
          lng,
          weight: newCases / CASES_PER_UNIT
        });
      }

      const sorted = Object.entries(framesMap)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, points]) => ({ date, points }));

      if (isMounted) setDataFrames(sorted);
    }

    // init globe
    const globe = Globe()(globeEl.current)
      .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
      .bumpImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
      .backgroundColor("rgba(0,0,0,0)")
      .showGlobe(true);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;

    globeInstance.current = globe;

    // land polygons
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => res.json())
      .then((geo) => {
        globe.polygonsData(geo.features)
          .polygonCapColor(() => "rgba(255,255,255,0.05)")
          .polygonSideColor(() => "rgba(0,0,0,0.2)")
          .polygonStrokeColor(() => "#ffffff")
          .polygonLabel((d) => `<b>${d.properties.name}</b>`);
      })
      .catch(() => { /* non-fatal */ });

    // start data load
    fetchData();

    return () => { isMounted = false; };
  }, []);

  // --- autoplay timer -----------------------------------------------------------
  useEffect(() => {
    if (!playing || dataFrames.length === 0) return undefined;

    const id = setInterval(() => {
      setCurrentFrame((f) => Math.min(f + 1, dataFrames.length - 1));
    }, FRAME_DURATION);

    return () => clearInterval(id);
  }, [playing, dataFrames]);

  // --- render hexbin heatmap for the current frame (accumulate up to current) --
  useEffect(() => {
    if (!globeInstance.current || dataFrames.length === 0) return;

    // accumulate all points up to currentFrame
    const merged = [];
    for (let i = 0; i <= currentFrame; i++) {
      merged.push(...dataFrames[i].points);
    }

    globeInstance.current
      .hexBinPointsData(merged)
      .hexBinPointWeight("weight")
      .hexAltitude(({ sumWeight }) => Math.log(sumWeight + 1) * 0.05) // scale height
      .hexTopColor(() => "rgba(255,0,0,0.8)")
      .hexSideColor(() => "rgba(200,0,0,0.5)")
      .hexBinResolution(4);
  }, [currentFrame, dataFrames]);

  // --- UI ----------------------------------------------------------------------
  const canRewind = currentFrame > 0;
  const canFwd = dataFrames.length > 0 && currentFrame < dataFrames.length - 1;
  const currentDate = dataFrames[currentFrame]?.date || "--";

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
          onClick={() => setCurrentFrame((f) => Math.max(f - 1, 0))}
          disabled={!canRewind}
        >
          ⏪
        </button>
        <button onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() =>
            setCurrentFrame((f) => Math.min(f + 1, dataFrames.length - 1))
          }
          disabled={!canFwd}
        >
          ⏩
        </button>
        <span className="date-label">{currentDate}</span>
      </div>
    </div>
  );
}
