import React from "react";
import DarkVeil from "./DarkVeil"; // ✅ Import from local file

export default function Background() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    >
      <DarkVeil />
    </div>
  );
}
