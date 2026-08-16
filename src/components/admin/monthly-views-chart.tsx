const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

export function MonthlyViewsChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 560;
  const height = 200;
  const paddingBottom = 28;
  const barGap = 12;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Vues mensuelles"
        className="w-full min-w-[420px]"
      >
        <line
          x1={0}
          y1={height - paddingBottom}
          x2={width}
          y2={height - paddingBottom}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const [, monthNum] = d.month.split("-");
          const label = MONTH_LABELS[Number(monthNum) - 1];
          const barHeight = (d.count / max) * (height - paddingBottom - 12);
          const x = i * (barWidth + barGap);
          const y = height - paddingBottom - barHeight;

          return (
            <g key={d.month}>
              <title>
                {label} — {d.count} vue{d.count > 1 ? "s" : ""}
              </title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={4}
                fill="var(--gold)"
                opacity={d.count === 0 ? 0.25 : 1}
              />
              <text
                x={x + barWidth / 2}
                y={height - paddingBottom + 16}
                textAnchor="middle"
                fontSize={11}
                fill="var(--muted)"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
