'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Plot, BuildingType } from '@/lib/types';
import { BUILDING_DEFS, GRID_SIZE } from '@/lib/buildings';

interface CityGridProps {
  plots: Plot[];
  onPlotTap: (plot: Plot) => void;
}

const CELL_SIZE = 36;

// Background colors by building type
const BUILDING_COLORS: Record<string, string> = {
  House: '#4a7c59',
  LumberMill: '#8B6914',
  Quarry: '#708090',
  Market: '#b8860b',
  TownHall: '#4169e1',
  Park: '#228B22',
};

export default function CityGrid({ plots, onPlotTap }: CityGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  // Build a map for O(1) lookup
  const plotMap = useRef<Map<string, Plot>>(new Map());
  useEffect(() => {
    const map = new Map<string, Plot>();
    for (const p of plots) {
      map.set(`${p.x},${p.y}`, p);
    }
    plotMap.current = map;
  }, [plots]);

  // Center grid on mount
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const gridPixels = GRID_SIZE * CELL_SIZE;
      setOffset({
        x: (clientWidth - gridPixels) / 2,
        y: (clientHeight - gridPixels) / 2,
      });
    }
  }, []);

  // Touch / mouse pan
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      dragMoved.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY };
      lastOffset.current = { ...offset };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [offset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragMoved.current = true;
      }
      setOffset({
        x: lastOffset.current.x + dx,
        y: lastOffset.current.y + dy,
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(3, Math.max(0.3, scale * delta));

      // Zoom toward cursor
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setOffset({
          x: cx - ((cx - offset.x) * newScale) / scale,
          y: cy - ((cy - offset.y) * newScale) / scale,
        });
      }

      setScale(newScale);
    },
    [scale, offset]
  );

  // Pinch zoom
  const lastPinchDist = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist.current > 0) {
          const delta = dist / lastPinchDist.current;
          setScale((s) => Math.min(3, Math.max(0.3, s * delta)));
        }
        lastPinchDist.current = dist;
      }
    },
    []
  );

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (dragMoved.current) return;
      const plot = plotMap.current.get(`${x},${y}`);
      if (plot) onPlotTap(plot);
    },
    [onPlotTap]
  );

  // Render grid cells
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const plot = plotMap.current.get(`${x},${y}`);
      const building = plot?.building_type as BuildingType | null;
      const level = plot?.level || 0;
      const bg = building ? BUILDING_COLORS[building] || '#555' : '#2d2d2d';
      const emoji = building ? BUILDING_DEFS[building]?.emoji : '';

      cells.push(
        <div
          key={`${x},${y}`}
          className="absolute border border-gray-800 flex items-center justify-center cursor-pointer select-none hover:brightness-125 transition-all"
          style={{
            left: x * CELL_SIZE,
            top: y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: bg,
            fontSize: CELL_SIZE * 0.5,
          }}
          onClick={() => handleCellClick(x, y)}
        >
          {emoji && <span>{emoji}</span>}
          {level > 1 && (
            <span className="absolute bottom-0 right-0.5 text-[8px] text-white font-bold opacity-80">
              {level}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-gray-950 touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          position: 'relative',
        }}
      >
        {cells}
      </div>
    </div>
  );
}
