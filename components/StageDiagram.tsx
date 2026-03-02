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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    setSelectedId(id);
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Base */}
      <rect x="6" y="21" width="12" height="2" rx="1" fill="#B27863" />
      <rect x="7" y="21" width="10" height="1" fill="#915B48" />

      {/* Main Column */}
      <path d="M7 21L9 10H15L17 21H7Z" fill="#7B4736" />
      {/* Column shadow/texture */}
      <rect x="11.5" y="12" width="1" height="7" rx="0.5" fill="#E4AB8A" />

      {/* Top Surface */}
      <rect x="3" y="6" width="18" height="5" rx="1.5" fill="#B27863" />
      <rect x="4" y="6" width="16" height="1.5" rx="0.5" fill="#C58E78" />

      {/* Gooseneck Mic */}
      <path d="M6 6V1C6 1 6 0.5 6.5 0.5H9C10 0.5 10 1.5 10 1.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="9" y="0.2" width="4" height="2" rx="1" fill="#756F6D" />
    </svg>
  );

  const BlueStandIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Vertical Stand */}
      <path d="M10 24V10" stroke="#1F2937" strokeWidth="2" />

      {/* Boom Arm */}
      <path d="M3 16L17 7" stroke="#1F2937" strokeWidth="2" />

      {/* Joint Knob */}
      <circle cx="10" cy="10" r="2.5" fill="#1F2937" />
      <circle cx="10" cy="10" r="0.8" fill="white" />

      {/* Cable */}
      <path d="M15 8.5Q11 11 11 15" stroke="#1F2937" strokeWidth="0.5" fill="none" />

      {/* Microphone at end */}
      <g transform="translate(16, 5) rotate(-30)">
        <rect x="0" y="0" width="3.5" height="2" rx="0.5" fill="#1F2937" />
        <path d="M3.5 0.3C4.5 0.3 5 1 5 1C5 1 4.5 1.7 3.5 1.7" fill="#F3F4F6" stroke="#1F2937" strokeWidth="0.3" />
      </g>
    </svg>
  );

  const MicIcon = ({ size = 24, color = "#4A5568" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g transform="rotate(45 12 12)">
        {/* Mic Handle */}
        <rect x="10.5" y="10" width="3" height="12" rx="1.5" fill={color} />
        {/* Mic Head / Grille */}
        <path d="M12 2C10.34 2 9 3.34 9 5C9 6.2 9.71 7.23 10.74 7.71L13.26 7.71C14.29 7.23 15 6.2 15 5C15 3.34 13.66 2 12 2Z" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="0.5" />
        {/* Grille Band */}
        <rect x="9" y="7.5" width="6" height="1.5" rx="0.5" fill="#9CA3AF" />
        {/* Switch shadow */}
        <rect x="11.5" y="12" width="1" height="2" rx="0.5" fill="black" fillOpacity="0.2" />
      </g>
    </svg>
  );

  const ChairIcon = ({ size = 24 }: { size?: number }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Legs */}
        <path d="M6 14.5L5.5 22H7.5L8 14.5Z" fill="#B08D64" stroke="black" strokeWidth="1" strokeLinejoin="round" />
        <path d="M11 14.5L11 22H13L13 14.5Z" fill="#B08D64" stroke="black" strokeWidth="1" strokeLinejoin="round" />
        <path d="M16 14.5L16 22H18L18 14.5Z" fill="#B08D64" stroke="black" strokeWidth="1" strokeLinejoin="round" />

        {/* Backrest */}
        <path d="M10 12L11.5 2H18.5L17 12H10Z" fill="#D28B5C" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Seat */}
        <path d="M5 12H17.5V14.5H6.5C5.5 14.5 5 14 5 13.5V12Z" fill="#E4AB8A" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
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
      case 'mic-grey': return <MicIcon size={size} color="#4B5563" />;
      case 'mic-yellow': return <MicIcon size={size} color="#CA8A04" />;
      case 'mic-red': return <MicIcon size={size} color="#B91C1C" />;
      case 'mic-blue': return <MicIcon size={size} color="#1D4ED8" />;
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
              <MicIcon size={20} color="#4B5563" />
              <span className="text-[10px] text-gray-400">Mic (B)</span>
            </button>

            <button onClick={() => addItem('mic-yellow')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Yellow Mic">
              <MicIcon size={20} color="#CA8A04" />
              <span className="text-[10px] text-gray-400">Mic (W)</span>
            </button>

            <button onClick={() => addItem('mic-red')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Red Mic">
              <MicIcon size={20} color="#B91C1C" />
              <span className="text-[10px] text-gray-400">Mic (R)</span>
            </button>

            <button onClick={() => addItem('mic-blue')} className="p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1" title="Add Blue Mic">
              <MicIcon size={20} color="#1D4ED8" />
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

            <div className="w-px h-8 bg-gray-200 mx-2"></div>

            <button
              onClick={() => {
                if (selectedId) {
                  onChange(items.map(item =>
                    item.id === selectedId ? { ...item, flipped: !item.flipped } : item
                  ));
                }
              }}
              className={`p-1 hover:bg-white hover:shadow rounded transition-all flex flex-col items-center gap-1 ${!selectedId ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Flip Selected"
              disabled={!selectedId}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 19l-7-7 7-7" />
                <path d="M13 5l7 7-7 7" />
                <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="4" />
              </svg>
              <span className="text-[10px] text-gray-400">Flip</span>
            </button>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 400 120"
        className="w-full h-40 border-b border-black cursor-crosshair bg-white"
        onMouseDown={() => setSelectedId(null)}
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
            className={`cursor-move ${draggingId === item.id ? 'opacity-50' : ''} ${selectedId === item.id ? 'filter drop-shadow-[0_0_2px_rgba(59,130,246,0.8)]' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <g transform={`${item.flipped ? 'scale(-1, 1)' : ''} translate(-15, -15)`}>
              {renderIcon(item.type, 30)}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};