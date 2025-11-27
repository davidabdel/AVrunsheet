import React, { useState, useRef } from 'react';
import { StageItem } from '../types';

interface StageDiagramProps {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
  readOnly?: boolean;
}

// Helper for generating IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const StageDiagram: React.FC<StageDiagramProps> = ({ items = [], onChange, readOnly = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const clickTimeRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (readOnly) return;

    const now = Date.now();
    const timeSinceLastClick = now - clickTimeRef.current;

    // If this is a double-click (within 300ms), remove the item
    if (timeSinceLastClick < 300) {
      onChange(items.filter(i => i.id !== id));
      clickTimeRef.current = 0;
      return;
    }

    clickTimeRef.current = now;
    setDraggingId(id);
    setHasMoved(false);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current || readOnly) return;

    setHasMoved(true);

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - svgRect.left) / svgRect.width) * 100;
    const y = ((e.clientY - svgRect.top) / svgRect.height) * 100;

    // Constrain to 0-100
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    const newItems = items.map(item =>
      item.id === draggingId ? { ...item, x: constrainedX, y: constrainedY } : item
    );
    onChange(newItems);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setHasMoved(false);
  };

  const addItem = (type: string) => {
    const newItem: StageItem = {
      id: generateId(),
      type,
      x: 50,
      y: 50
    };
    onChange([...items, newItem]);
  };

  // --- Icon Components ---

  const BlueLecternIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h12" /> {/* Top horizontal */}
      <path d="M12 6v10" /> {/* Vertical stem */}
      <path d="M12 16l-4 6" /> {/* Left leg */}
      <path d="M12 16l4 6" /> {/* Right leg */}
    </svg>
  );

  const BlueStandIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V6" /> {/* Vertical */}
      <path d="M12 6L7 2" /> {/* Angled top left */}
    </svg>
  );

  const MicIcon = ({ size = 24, color }: { size?: number, color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      {/* Rotated Mic Shape */}
      <g transform="rotate(45 12 12)">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} strokeWidth="2" fill="none" />
        <path d="M12 19v4" stroke={color} strokeWidth="2" />
        <path d="M8 23h8" stroke={color} strokeWidth="2" />
      </g>
    </svg>
  );

  const ChairIcon = ({ size = 24 }: { size?: number }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Back left leg */}
        <rect x="8" y="4" width="2" height="14" fill="#A0704F" rx="0.5" />
        {/* Back right leg */}
        <rect x="14" y="4" width="2" height="14" fill="#8B5E3C" rx="0.5" />
        {/* Front left leg */}
        <rect x="8" y="12" width="2" height="8" fill="#A0704F" rx="0.5" />
        {/* Front right leg */}
        <rect x="14" y="12" width="2" height="8" fill="#8B5E3C" rx="0.5" />

        {/* Backrest horizontal bar */}
        <rect x="8" y="6" width="8" height="2" fill="#C4956B" rx="0.5" />

        {/* Seat - isometric view */}
        <path d="M 7 12 L 17 12 L 16 14 L 8 14 Z" fill="#D4C4A8" />
        <path d="M 8 14 L 16 14 L 16 15 L 8 15 Z" fill="#BFB090" />

        {/* Support bars under seat */}
        <rect x="8" y="15" width="8" height="1" fill="#8B5E3C" rx="0.3" />
      </svg>
    );
  };

  const TableIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Table top - ellipse for perspective */}
      <ellipse cx="12" cy="8" rx="10" ry="3" fill="#F4C7A0" stroke="#E8B088" strokeWidth="0.5" />
      {/* Table top edge/thickness */}
      <ellipse cx="12" cy="8.5" rx="10" ry="2.5" fill="#F0BA8F" />

      {/* Curved tripod legs */}
      {/* Left leg */}
      <path d="M 7 9 Q 5 12 4 18 L 6 18 Q 7 13 8 10 Z" fill="#5A6570" stroke="#4A5560" strokeWidth="0.3" />
      {/* Right leg */}
      <path d="M 17 9 Q 19 12 20 18 L 18 18 Q 17 13 16 10 Z" fill="#5A6570" stroke="#4A5560" strokeWidth="0.3" />
      {/* Center leg */}
      <path d="M 11 9 L 10.5 18 L 13.5 18 L 13 9 Z" fill="#4A5560" stroke="#3A4550" strokeWidth="0.3" />
    </svg>
  );



  // Render icon based on type
  const renderIcon = (type: string, size: number = 24) => {
    switch (type) {
      case 'lectern-blue': return <BlueLecternIcon size={size} />;
      case 'stand-blue': return <BlueStandIcon size={size} />;
      case 'mic-grey': return <MicIcon size={size} color="#9CA3AF" />;
      case 'mic-yellow': return <MicIcon size={size} color="#EAB308" />;
      case 'mic-red': return <MicIcon size={size} color="#EF4444" />;
      case 'mic-blue': return <MicIcon size={size} color="#3B82F6" />;
      case 'chair': return <ChairIcon size={size} />;
      case 'table': return <TableIcon size={size} />;
      default: return <div className="w-4 h-4 bg-black rounded-full" />;
    }
  };

  return (
    <div className="w-full flex flex-col items-center border border-gray-300 bg-white p-2 select-none">
      {/* Controls - Hidden in Print */}
      {!readOnly && (
        <div className="flex flex-col gap-2 mb-2 print:hidden w-full bg-gray-50 p-2 rounded border border-gray-100">
          {/* Instructions at top */}
          <div className="w-full text-center">
            <span className="text-xs text-gray-400 italic">(Drag to move, Double click to remove)</span>
          </div>

          {/* Icons row */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <span className="text-xs text-gray-500 font-medium">Add to Stage:</span>

            <button onClick={() => addItem('stand-blue')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Stand">
              <BlueStandIcon size={20} />
              <span className="text-[10px] text-gray-400">Stand</span>
            </button>

            <button onClick={() => addItem('lectern-blue')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Lectern">
              <BlueLecternIcon size={20} />
              <span className="text-[10px] text-gray-400">Lectern</span>
            </button>

            <button onClick={() => addItem('mic-grey')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Grey Mic">
              <MicIcon size={20} color="#9CA3AF" />
              <span className="text-[10px] text-gray-400">Mic (B)</span>
            </button>

            <button onClick={() => addItem('mic-yellow')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Yellow Mic">
              <MicIcon size={20} color="#EAB308" />
              <span className="text-[10px] text-gray-400">Mic (W)</span>
            </button>

            <button onClick={() => addItem('mic-red')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Red Mic">
              <MicIcon size={20} color="#EF4444" />
              <span className="text-[10px] text-gray-400">Mic (R)</span>
            </button>

            <button onClick={() => addItem('mic-blue')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Blue Mic">
              <MicIcon size={20} color="#3B82F6" />
              <span className="text-[10px] text-gray-400">Mic (B)</span>
            </button>


            <button onClick={() => addItem('chair')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Chair">
              <ChairIcon size={20} />
              <span className="text-[10px] text-gray-400">Chair</span>
            </button>

            <button onClick={() => addItem('table')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Table">
              <TableIcon size={20} />
              <span className="text-[10px] text-gray-400">Table</span>
            </button>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 400 120"
        className="w-full h-40 border-b border-black cursor-crosshair bg-white"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Stage Structure Lines (Fixed) */}
        <line x1="10" y1="10" x2="10" y2="120" stroke="black" strokeWidth="1" />
        <line x1="390" y1="10" x2="390" y2="120" stroke="black" strokeWidth="1" />
        <text x="15" y="50" fontSize="11" fontFamily="sans-serif" style={{ writingMode: 'vertical-rl' }}>Stage Right</text>
        <text x="385" y="50" fontSize="11" fontFamily="sans-serif" style={{ writingMode: 'vertical-rl' }}>Stage Left</text>
        <text x="200" y="110" textAnchor="middle" fontSize="12" fontFamily="serif">Downstage/Front Stage</text>

        {/* Dynamic Items */}
        {items.map(item => (
          <g
            key={item.id}
            transform={`translate(${item.x * 4}, ${item.y})`}
            className={`cursor-move ${draggingId === item.id ? 'opacity-50' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <g transform="translate(-15, -15)">
              {renderIcon(item.type, 30)}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};