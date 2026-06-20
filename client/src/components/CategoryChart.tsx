import { useMemo } from "react";
import Plot from "react-plotly.js";

interface CategoryChartProps {
  data: Array<{
    category: string;
    count: number;
  }>;
}

export default function CategoryChart({ data }: CategoryChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Sort by count descending
    const sorted = [...data].sort((a, b) => b.count - a.count);

    const colors: Record<string, string> = {
      incident: "#ef4444",
      policy: "#3b82f6",
      staffing: "#eab308",
      reform: "#22c55e",
      memorial: "#a855f7",
      legal: "#f97316",
      other: "#6b7280",
    };

    return [
      {
        labels: sorted.map((d) => d.category),
        values: sorted.map((d) => d.count),
        type: "pie",
        marker: {
          colors: sorted.map((d) => colors[d.category] || colors.other),
          line: {
            color: "#1f2937",
            width: 2,
          },
        },
        textposition: "inside",
        textinfo: "label+percent",
        hovertemplate: "<b>%{label}</b><br>Count: %{value}<br>%{percentLabel}<extra></extra>",
      },
    ];
  }, [data]);

  const layout = {
    title: {
      text: "",
      font: { color: "#ffffff" },
    },
    plot_bgcolor: "#111827",
    paper_bgcolor: "#111827",
    font: {
      color: "#9ca3af",
    },
    margin: {
      l: 20,
      r: 20,
      t: 20,
      b: 20,
    },
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
      bgcolor: "rgba(0, 0, 0, 0.5)",
      bordercolor: "#374151",
      borderwidth: 1,
    },
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
