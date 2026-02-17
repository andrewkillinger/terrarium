'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Plot, BuildingType, District } from '@/lib/types';
import { BUILDING_DEFS, GRID_SIZE, detectDistricts } from '@/lib/buildings';

interface CityGridProps {
  plots: Plot[];
  onPlotTap: (plot: Plot) => void;
  userId: string | null;
  lastPlacedPlot?: { x: number; y: number; tick: number };
  lastUpgradedPlot?: { x: number; y: number; tick: number };
  showMiniMap: boolean;
}

const CELL_SIZE = 40;

// CSS class per building type
const BUILDING_CELL_CLASS: Record<string, string> = {
  House: 'cell-house',
  LumberMill: 'cell-lumbermill',
  Quarry: 'cell-quarry',
  Market: 'cell-market',
  TownHall: 'cell-townhall',
  Park: 'cell-park',
  Factory: 'cell-factory',
  Cathedral: 'cell-cathedral',
  Harbor: 'cell-harbor',
  Road: 'cell-road',
};

// Ambient animation per building type
const BUILDING_ANIMATION: Record<string, string> = {
  LumberMill: 'animate-smoke',
  Factory: 'animate-smoke',
  Park: '',  // tree sway applied to emoji
  Market: 'animate-shimmer',
  Cathedral: 'animate-stars',
  Harbor: 'animate-water',
};

// Mini-map colors
const MINIMAP_COLORS: Record<string, string> = {
  House: '#4CAF50',
  LumberMill: '#8B6914',
  Quarry: '#708090',
  Market: '#FFC107',
  TownHall: '#42A5F5',
  Park: '#43A047',
  Factory: '#FF9800',
  Cathedral: '#AB47BC',
  Harbor: '#26A69A',
  Road: '#777',
};

export default function CityGrid({ plots, onPlotTap, userId, lastPlacedPlot, lastUpgradedPlot, showMiniMap }: CityGridProps) {
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
    for (const p of plots) map.set(`${p.x},${p.y}`, p);
    plotMap.current = map;
  }, [plots]);

  // Detect districts for visual overlays
  const districtMap = useMemo(() => {
    const districts = detectDistricts(plots);
    const map = new Map<string, District>();
    for (const d of districts) {
      for (const [dx, dy] of d.plots) map.set(`${dx},${dy}`, d);
    }
    return map;
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
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true;
      setOffset({
        x: lastOffset.current.x + dx,
        y: lastOffset.current.y + dy,
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(3, Math.max(0.3, scale * delta));
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

  const lastPinchDist = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const d = dist / lastPinchDist.current;
        setScale((s) => Math.min(3, Math.max(0.3, s * d)));
      }
      lastPinchDist.current = dist;
    }
  }, []);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (dragMoved.current) return;
      const plot = plotMap.current.get(`${x},${y}`);
      if (plot) onPlotTap(plot);
    },
    [onPlotTap]
  );

  // Navigate mini-map click to that area
  const handleMiniMapClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const miniSize = 120;
      const cellMini = miniSize / GRID_SIZE;
      const gridX = mx / cellMini;
      const gridY = my / cellMini;

      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setOffset({
          x: clientWidth / 2 - gridX * CELL_SIZE * scale,
          y: clientHeight / 2 - gridY * CELL_SIZE * scale,
        });
      }
    },
    [scale]
  );

  // Mini-map canvas rendering
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!showMiniMap || !miniMapRef.current) return;
    const canvas = miniMapRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    const cellSize = size / GRID_SIZE;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    for (const plot of plots) {
      if (plot.building_type) {
        ctx.fillStyle = MINIMAP_COLORS[plot.building_type] || '#555';
        const brightness = 0.5 + (plot.level / 5) * 0.5;
        ctx.globalAlpha = brightness;
        ctx.fillRect(plot.x * cellSize, plot.y * cellSize, cellSize, cellSize);
      }
    }
    ctx.globalAlpha = 1;

    // Viewport indicator
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const vx = (-offset.x / scale) / CELL_SIZE * cellSize;
      const vy = (-offset.y / scale) / CELL_SIZE * cellSize;
      const vw = (clientWidth / scale) / CELL_SIZE * cellSize;
      const vh = (clientHeight / scale) / CELL_SIZE * cellSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, vw, vh);
    }
  }, [plots, showMiniMap, offset, scale]);

  // Render grid cells
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const plot = plotMap.current.get(`${x},${y}`);
      const building = plot?.building_type as BuildingType | null;
      const level = plot?.level || 0;
      const emoji = building ? BUILDING_DEFS[building]?.emoji : '';
      const isOwned = plot?.placed_by_user_id === userId && userId !== null;
      const district = districtMap.get(`${x},${y}`);

      // Build CSS classes
      let cellClass = 'cell-empty';
      if (building) {
        cellClass = BUILDING_CELL_CLASS[building] || 'cell-empty';
        if (level > 1) {
          const levelClass = `${cellClass}-${level}`;
          cellClass = `${cellClass} ${levelClass}`;
        }
      }

      // Ambient animation class
      const animClass = building ? (BUILDING_ANIMATION[building] || '') : '';

      // Placement/upgrade animation
      const isJustPlaced = lastPlacedPlot && lastPlacedPlot.x === x && lastPlacedPlot.y === y;
      const isJustUpgraded = lastUpgradedPlot && lastUpgradedPlot.x === x && lastUpgradedPlot.y === y;
      const actionAnim = isJustPlaced ? 'animate-building-place' : isJustUpgraded ? 'animate-upgrade' : '';

      // District border
      const districtClass = district ? `cell-district-${district.type}` : '';

      // Glow for high-level buildings
      const glowClass = building && level >= 3 ? 'animate-glow' : '';

      // Ownership indicator
      const ownedClass = isOwned && building ? 'cell-owned' : '';

      cells.push(
        <div
          key={`${x},${y}`}
          className={`absolute border flex items-center justify-center cursor-pointer select-none transition-all duration-200 hover:brightness-125 hover:z-10 overflow-hidden ${cellClass} ${animClass} ${actionAnim} ${districtClass} ${glowClass} ${ownedClass}`}
          style={{
            left: x * CELL_SIZE,
            top: y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            fontSize: CELL_SIZE * 0.5,
            borderWidth: 1,
          }}
          onClick={() => handleCellClick(x, y)}
        >
          {emoji && (
            <span className={building === 'Park' ? 'animate-tree-sway' : ''} style={{ lineHeight: 1 }}>
              {emoji}
            </span>
          )}
          {level > 0 && building && (
            <span className={`level-badge level-${Math.min(level, 5)}`}>
              {level}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden touch-none" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 100%)' }}>
      <div
        ref={containerRef}
        className="w-full h-full"
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

      {/* Mini-map overlay */}
      {showMiniMap && (
        <div className="absolute top-2 right-2 z-20">
          <canvas
            ref={miniMapRef}
            className="rounded-lg border border-white/20 cursor-pointer shadow-lg"
            style={{ width: 120, height: 120, background: '#0f172a' }}
            onClick={handleMiniMapClick}
          />
        </div>
      )}
    </div>
  );
}
