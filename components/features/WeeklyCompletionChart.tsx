import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

export type WeekPoint = {
  label: string;
  rate: number;
  checkIns: number;
  possible: number;
};

const WIDTH = 640;
const HEIGHT = 280;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 40 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [0, 25, 50, 75, 100];

/**
 * Weekly completion-rate bar chart. A Server Component: visx renders plain SVG
 * (via `scaleBand`/`scaleLinear` + `Bar`), so it works without client JS, has no
 * hydration flash, and is server-rendered. Colors use Tailwind tokens
 * (`currentColor`/`fill-*`/`stroke-*`) — no hardcoded hex. The `viewBox` makes it
 * responsive; native `<title>` elements provide hover tooltips.
 */
export function WeeklyCompletionChart({ data }: { data: WeekPoint[] }) {
  const xScale = scaleBand<string>({
    domain: data.map((d) => d.label),
    range: [0, INNER_W],
    padding: 0.3,
  });
  const yScale = scaleLinear<number>({ domain: [0, 100], range: [INNER_H, 0] });

  return (
    <div className="w-full text-blue-600 dark:text-blue-500">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Weekly completion rate for the last 8 weeks"
      >
        <Group left={MARGIN.left} top={MARGIN.top}>
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={0}
                x2={INNER_W}
                y1={yScale(tick)}
                y2={yScale(tick)}
                className="stroke-neutral-200 dark:stroke-neutral-800"
                strokeWidth={1}
              />
              <text
                x={-8}
                y={yScale(tick)}
                dy="0.32em"
                textAnchor="end"
                fontSize={10}
                className="fill-neutral-500"
              >
                {tick}%
              </text>
            </g>
          ))}

          {data.map((d) => {
            const x = xScale(d.label) ?? 0;
            const barHeight = INNER_H - yScale(d.rate);
            return (
              <g key={d.label}>
                <title>{`Week of ${d.label}: ${d.rate}% (${d.checkIns}/${d.possible})`}</title>
                <Bar
                  x={x}
                  y={yScale(d.rate)}
                  width={xScale.bandwidth()}
                  height={barHeight}
                  rx={4}
                  fill="currentColor"
                />
                <text
                  x={x + xScale.bandwidth() / 2}
                  y={INNER_H + 16}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-neutral-500"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </Group>
      </svg>
    </div>
  );
}
