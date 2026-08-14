import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useSelector } from "react-redux";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, options }) => {
  const isDark = useSelector((state) => state.theme?.mode === "dark");

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 6,
          boxHeight: 6,
          color: isDark ? "#94a3b8" : "#71717A",
          font: { family: "Inter", size: 11, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(13, 17, 28, 0.92)",
        titleFont: { family: "Inter", size: 12 },
        bodyFont: { family: "Inter", size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? "#64748b" : "#A1A1AA", font: { family: "Inter", size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(13, 17, 28, 0.06)", drawBorder: false },
        border: { dash: [4, 4] },
        ticks: { color: isDark ? "#64748b" : "#A1A1AA", font: { family: "Inter", size: 11 } },
      },
    },
  };

  const merged = options ? { ...defaultOptions, ...options } : defaultOptions;

  return (
    <div className="h-72 w-full">
      <Line data={data} options={merged} />
    </div>
  );
};

export default LineChart;
