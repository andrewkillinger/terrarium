import type { Child } from '../types'

interface Props {
  children: Child[]
  selected: Child | null
  onChange: (child: Child) => void
}

export default function ChildSelector({ children, selected, onChange }: Props) {
  return (
    <div className="segmented" role="tablist" aria-label="Select child">
      {children.map((child) => (
        <button
          key={child.id}
          role="tab"
          aria-selected={selected?.id === child.id}
          className={`segmented__btn${selected?.id === child.id ? ' segmented__btn--active' : ''}`}
          onClick={() => onChange(child)}
        >
          {child.name}
        </button>
      ))}
    </div>
  )
}
