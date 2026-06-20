import { useMemo } from "react";
import Plot from "react-plotly.js";

interface FacilityChartProps {
  data: Array<{
    facility: string;
    count: number;
  }>;
}

export default function FacilityChart({ data }: FacilityChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Sort by count descending and take top 15
    const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 15);

    return [
      {
        x: sorted.map((d) => d.count),
        y: sorted.map((d) => d.facility),
        type: "bar",
        orientation: "h",
        marker: {
          color: "#06b6d4",
          line: {
            color: "#0891b2",
            width: 1,
          },
        },
        hovertemplate: "<b>%{y}</b><br>Articles: %{x}<extra></extra>",
      },
    ];
  }, [data]);

  const layout = {
    title: {
      text: "",
      font: { color: "#ffffff" },
    },
    xaxis: {
      title: "Article Count",
      showgrid: true,
      gridcolor: "#374151",
      color: "#9ca3af",
      zeroline: false,
    },
    yaxis: {
      title: "Facility",
      showgrid: false,
      color: "#9ca3af",
      autorange: "reversed",
    },
    plot_bgcolor: "#111827",
    paper_bgcolor: "#111827",
    font: {
      color: "#9ca3af",
    },
    margin: {
      l: 150,
      r: 50,
      t: 20,
      b: 50,
    },
    hovermode: "y unified",
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  return (
    <div className="w-full h-96">
      <Plot
        data={chartData}
        layout={layout}
        config={config}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
