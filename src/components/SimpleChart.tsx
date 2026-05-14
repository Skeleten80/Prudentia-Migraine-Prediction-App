interface Props {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  unit?: string;
  dots?: { index: number; color: string; label: string }[];
}

export default function SimpleChart({
  data,
  labels,
  color = '#6b8cff',
  height = 100,
  unit = '',
  dots = [],
}: Props) {
  if (data.length < 2) return null;

  const W = 560;
  const H = height;
  const PAD = { top: 12, right: 16, bottom: 28, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - min) / range) * chartH;

  const points = data.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');

  // Y axis ticks (3 values)
  const yTicks = [min, min + range / 2, max];

  // X axis labels – show first, middle, last
  const xLabelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        style={{ width: '100%', height: `${H}px` }}
        aria-hidden="true"
      >
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={yScale(v)}
              x2={W - PAD.right} y2={yScale(v)}
              stroke="#2a2f4a" strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={yScale(v) + 4}
              textAnchor="end" fontSize="10" fill="#5a6080"
            >
              {typeof v === 'number' ? v.toFixed(0) : v}{unit}
            </text>
          </g>
        ))}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Fill under line */}
        <polygon
          points={`${xScale(0)},${PAD.top + chartH} ${points} ${xScale(data.length - 1)},${PAD.top + chartH}`}
          fill={color}
          opacity="0.08"
        />

        {/* Migraine event dots */}
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={xScale(d.index)}
            cy={yScale(data[d.index])}
            r="5"
            fill={d.color}
            stroke="#0f1117"
            strokeWidth="1.5"
          />
        ))}

        {/* X axis labels */}
        {xLabelIdx.map(i => (
          labels?.[i] ? (
            <text
              key={i}
              x={xScale(i)}
              y={H - 4}
              textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
              fontSize="9"
              fill="#5a6080"
            >
              {labels[i]}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  );
}
