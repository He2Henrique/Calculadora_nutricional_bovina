import { useState } from "react";
import type {Tab} from "../types";


interface Props{
    tabs: Tab[];
    activeTab: Tab;
    setSection: (context: Tab) => void;
}


export default function TabMenu({tabs, activeTab, setSection}: Props) {

  return (
    <div>
      {/* Tab headers */}
      <div className="segmented">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab)}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: activeTab.id === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
              fontWeight: activeTab.id === tab.id ? "600" : "400",
              color: activeTab.id === tab.id ? "#3b82f6" : "#333",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}