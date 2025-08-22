import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { Line, Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./Dashboard.css";

export default function Dashboard() {
  const [covidData, setCovidData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("India");

  useEffect(() => {
    // Load CSV file
    Papa.parse("/owid-covid-data.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        setCovidData(results.data);
      },
    });
  }, []);

  if (covidData.length === 0) return <p>Loading Dashboard...</p>;

  // Filter data for selected country
  const countryData = covidData.filter(
    (row) => row.location === selectedCountry
  );

  // Line chart (cases trend)
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

  // Pie chart (deaths vs survivors)
  const latest = countryData[countryData.length - 1] || {};
  const pieData = {
    labels: ["Deaths", "Survivors"],
    datasets: [
      {
        data: [latest.total_deaths || 0, (latest.total_cases || 0) - (latest.total_deaths || 0)],
        backgroundColor: ["red", "green"],
      },
    ],
  };

  // Bar chart (Top 10 countries by total cases)
  const latestDate = covidData[covidData.length - 1].date;
  const latestSnapshot = covidData.filter((row) => row.date === latestDate);
  const topCountries = latestSnapshot
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
          <h3>Top 10 Countries by Cases</h3>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
}
