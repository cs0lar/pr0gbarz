export interface ChartPoint {
  label: string
  value: number
}

function pointCoordinates(points: ChartPoint[]): { x: number; y: number }[] {
  if (points.length === 0) return []
  const values = points.map((point) => point.value)
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(1, ...values)
  const range = maximum - minimum
  return points.map((point, index) => ({
    x: points.length === 1 ? 50 : (index / (points.length - 1)) * 100,
    y: 44 - ((point.value - minimum) / range) * 38,
  }))
}

export function ProgressChart({
  description,
  points,
  title,
}: {
  description: string
  points: ChartPoint[]
  title: string
}) {
  const coordinates = pointCoordinates(points)
  const path = coordinates
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ')
  const titleId = `chart-${useId().replaceAll(':', '')}`

  return (
    <figure className="progress-chart">
      <svg
        aria-labelledby={`${titleId}-title ${titleId}-description`}
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 48"
      >
        <title id={`${titleId}-title`}>{title}</title>
        <desc id={`${titleId}-description`}>{description}</desc>
        <line
          className="progress-chart__axis"
          x1="0"
          x2="100"
          y1="44"
          y2="44"
        />
        <polyline
          className="progress-chart__line"
          fill="none"
          points={path}
          vectorEffect="non-scaling-stroke"
        />
        {coordinates.map((point, index) => (
          <circle
            className="progress-chart__point"
            cx={point.x}
            cy={point.y}
            key={`${points[index]?.label ?? 'point'}-${String(index)}`}
            r="1.5"
          />
        ))}
      </svg>
      <figcaption>{description}</figcaption>
    </figure>
  )
}
import { useId } from 'react'
