import type { Location } from '../types'

interface Props {
  location: Location
}

export default function LocationBadge({ location }: Props) {
  return (
    <span className={`badge badge--${location}`} aria-label={`Location: ${location}`}>
      {location}
    </span>
  )
}
