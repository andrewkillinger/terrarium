import type { Camp } from '../types'
import LocationBadge from './LocationBadge'

// Emoji placeholders per location while real photos load or are missing
const LOCATION_EMOJI: Record<string, string> = {
  ME: '🎨',
  ECKE: '⚽',
  GC: '🤸',
}

interface Props {
  camp: Camp
  selected: boolean
  onClick: () => void
}

export default function CampCard({ camp, selected, onClick }: Props) {
  const emoji = LOCATION_EMOJI[camp.location] ?? '🏕️'

  return (
    <button
      className={`camp-card${selected ? ' camp-card--selected' : ''}`}
      onClick={onClick}
      aria-label={`Choose ${camp.name}`}
      aria-pressed={selected}
    >
      <div className="camp-card__image-wrap">
        {camp.image_url ? (
          <img
            className="camp-card__image"
            src={camp.image_url}
            alt={camp.name}
            loading="lazy"
            onError={(e) => {
              // Graceful fallback to placeholder on broken image
              const target = e.currentTarget
              target.style.display = 'none'
              const placeholder = target.nextElementSibling as HTMLElement | null
              if (placeholder) placeholder.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="camp-card__image-placeholder"
          style={{ display: camp.image_url ? 'none' : 'flex' }}
          aria-hidden="true"
        >
          {emoji}
        </div>
        <div className="camp-card__badge">
          <LocationBadge location={camp.location} />
        </div>
      </div>

      <div className="camp-card__body">
        <div className="camp-card__name">{camp.name}</div>
        <div className="camp-card__desc">{camp.description}</div>
      </div>
    </button>
  )
}
