import { useMemo } from "react";
import Plot from "react-plotly.js";

interface PopulationChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export default function PopulationChart({ data }: PopulationChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Sort by date
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return [
      {
        x: sorted.map((d) => d.date),
        y: sorted.map((d) => d.count),
        type: "scatter",
        mode: "lines+markers",
        name: "Articles",
        line: {
          color: "#3b82f6",
          width: 2,
        },
        marker: {
          color: "#3b82f6",
          size: 6,
        },
        fill: "tozeroy",
        fillcolor: "rgba(59, 130, 246, 0.1)",
      },
    ];
  }, [data]);

  const layout = {
    title: {
      text: "",
      font: { color: "#ffffff" },
    },
    xaxis: {
      title: "Date",
      showgrid: true,
      gridcolor: "#374151",
      color: "#9ca3af",
      zeroline: false,
    },
    yaxis: {
      title: "Article Count",
      showgrid: true,
      gridcolor: "#374151",
      color: "#9ca3af",
      zeroline: false,
    },
    plot_bgcolor: "#111827",
    paper_bgcolor: "#111827",
    font: {
      color: "#9ca3af",
    },
    margin: {
      l: 50,
      r: 50,
      t: 20,
      b: 50,
    },
    hovermode: "x unified",
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  return (
    <div className="w-full h-80">
      <Plot
        data={chartData}
        layout={layout}
        config={config}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
