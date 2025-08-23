import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { Line, Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";

// 🔑 Same name mapping as GlobeMap
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

export default function Dashboard() {
  const [covidData, setCovidData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("India");

  useEffect(() => {
    Papa.parse("/data/owid-covid-data.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        // Normalize names immediately
        const normalized = results.data
          .filter((row) => row.location && row.date) // drop bad rows
          .map((row) => {
            let loc = row.location;
            if (countryNameMap[loc]) {
              loc = countryNameMap[loc];
            }
            return { ...row, location: loc };
          });
        setCovidData(normalized);
      },
    });
  }, []);

  if (covidData.length === 0) return <p>Loading Dashboard...</p>;

  // ✅ Filter data for selected country
  const countryData = covidData.filter(
    (row) => row.location === selectedCountry
  );

  // ✅ Get latest snapshot of that country
  const latestCountryData = countryData[countryData.length - 1] || {};
  const totalCases = latestCountryData.total_cases || 0;
  const totalDeaths = latestCountryData.total_deaths || 0;
  const totalSurvivors = Math.max(totalCases - totalDeaths, 0);

  // ✅ Line chart (cases trend)
  const lineData = {
    labels: countryData.map((row) => row.date),
    datasets: [
      {
        label: "Total Cases",
        data: countryData.map((row) => row.total_cases || 0),
        borderColor: "blue",
        fill: false,
      },
    ],
  };

  // ✅ Pie chart (deaths vs survivors)
  const pieData = {
    labels: ["Deaths", "Survivors"],
    datasets: [
      {
        data: [totalDeaths, totalSurvivors],
        backgroundColor: ["red", "green"],
      },
    ],
  };

  // ✅ Bar chart (Top 10 countries by total cases on latest date globally)
  const latestDate = covidData.reduce(
    (max, row) => (row.date > max ? row.date : max),
    "2020-01-01"
  );

  const latestSnapshot = covidData.filter((row) => row.date === latestDate);

  const topCountries = latestSnapshot
    .filter((row) => row.total_cases) // remove empty
    .sort((a, b) => (b.total_cases || 0) - (a.total_cases || 0))
    .slice(0, 10);

  const barData = {
    labels: topCountries.map((row) => row.location),
    datasets: [
      {
        label: "Total Cases",
        data: topCountries.map((row) => row.total_cases || 0),
        backgroundColor: "orange",
      },
    ],
  };

  return (
    <div className="dashboard">
      <h2>COVID-19 Dashboard</h2>

      <div className="country-selector">
        <label>Select Country: </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          {[...new Set(covidData.map((row) => row.location))].map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h3>Cases Trend ({selectedCountry})</h3>
          <Line data={lineData} />
        </div>

        <div className="chart-box">
          <h3>Deaths vs Survivors</h3>
          <Pie data={pieData} />
        </div>

        <div className="chart-box">
          <h3>Top 10 Countries by Cases ({latestDate})</h3>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
}
