import React, { useState } from 'react';
import { Segment, SegmentType, SegmentContent } from '../types';
import { StageDiagram } from './StageDiagram';
import { Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';

interface SegmentRowProps {
  segment: Segment;
  onChange: (id: string, content: SegmentContent) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onInsertAfter: (id: string, type: SegmentType) => void;
}

export const SegmentRow: React.FC<SegmentRowProps> = ({ segment, onChange, onRemove, onMove, onInsertAfter }) => {
  const { id, type, content } = segment;
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  const update = (field: keyof SegmentContent, value: any) => {
    onChange(id, { ...content, [field]: value });
  };

  const renderContent = () => {
    switch (type) {
      case SegmentType.Header:
        return (
          <div className="text-center mb-6 pt-2">
            <textarea
              className="w-full text-center text-3xl font-bold border-none bg-transparent focus:ring-1 focus:ring-gray-300 placeholder-gray-300 rounded hover:bg-white transition-colors resize-none break-words whitespace-pre-wrap"
              value={content.title || ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Convention Title"
              rows={2}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <input
              className="w-full text-center text-xl font-bold border-none bg-transparent focus:ring-1 focus:ring-gray-300 placeholder-gray-300 mt-1 rounded hover:bg-white transition-colors"
              value={content.subtitle || ''}
              onChange={(e) => update('subtitle', e.target.value)}
              placeholder="Theme / Subtitle"
            />
            <input
              className="w-full text-center text-lg font-bold border-none bg-transparent focus:ring-1 focus:ring-gray-300 placeholder-gray-300 mt-1 rounded hover:bg-white transition-colors"
              value={content.date || ''}
              onChange={(e) => update('date', e.target.value)}
              placeholder="Day - Session"
            />
          </div>
        );

      case SegmentType.Note:
        const noteText = content.text || '';
        const startsWithNote = /^notes?:\s*/i.test(noteText);

        return (
          <div className="border border-gray-300 p-3 text-sm mb-2 hover:bg-white transition-colors">
            {!startsWithNote && <span className="font-bold text-blue-600 mr-1">Note:</span>}
            <textarea
              className="w-full align-top bg-transparent border-none focus:ring-0 resize-none overflow-hidden"
              rows={3}
              value={noteText}
              onChange={(e) => update('text', e.target.value)}
              placeholder="Enter note instructions here..."
            />
          </div>
        );

      case SegmentType.TimeBox:
        return (
          <div className="border border-dashed border-gray-300 p-2 text-sm mb-2 flex items-start gap-3 bg-slate-50 print:bg-transparent hover:bg-slate-100 transition-colors">
            <div className="flex-shrink-0 bg-cyan-50 rounded-md px-2 py-1 flex items-center shadow-sm">
              <span className="text-sheet-cyan font-bold text-sm">(</span>
              <input
                className="w-12 bg-transparent font-bold text-sheet-cyan text-sm border-none p-0 focus:ring-0 text-center placeholder-cyan-300 mx-1"
                value={content.time || ''}
                onChange={(e) => update('time', e.target.value)}
                placeholder="9:30"
              />
              <span className="text-sheet-cyan font-bold text-sm">)</span>
            </div>
            <textarea
              className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none"
              rows={1}
              value={content.text || ''}
              onChange={(e) => update('text', e.target.value)}
              placeholder="Event description..."
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case SegmentType.Cue:
        return (
          <div className="border border-gray-200 border-b-gray-300 text-sm grid grid-cols-[180px_200px_1fr] print:grid-cols-[140px_180px_1fr] items-start mb-[1px] hover:bg-gray-50 transition-colors">
            <div className="p-2 border-r border-gray-200 relative">
              <input
                className={`w-full bg-transparent font-bold border-none p-0 focus:ring-0 ${content.isMedia ? 'text-sheet-red' : 'text-sheet-red'}`}
                value={content.cueLabel || ''}
                onChange={(e) => update('cueLabel', e.target.value)}
                placeholder="Camera/Media"
                onFocus={() => setShowInsertMenu(true)}
                onBlur={() => setTimeout(() => setShowInsertMenu(false), 200)}
              />
              {showInsertMenu && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[200px]">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b">Quick Templates</div>
                  <button
                    onClick={() => {
                      const camera = prompt('Camera number:', '1');
                      const preset = prompt('Preset number:', '1');
                      if (camera && preset) update('cueLabel', `Camera ${camera} Preset ${preset}`);
                      setShowInsertMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs"
                  >
                    Camera _ Preset _
                  </button>
                  <button
                    onClick={() => { update('cueLabel', 'Media'); setShowInsertMenu(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs"
                  >
                    Media
                  </button>
                </div>
              )}
            </div>
            <div className="p-2 border-r border-gray-200 font-bold relative">
              <input
                className="w-full bg-transparent border-none p-0 focus:ring-0"
                value={content.cueId || ''}
                onChange={(e) => update('cueId', e.target.value)}
                placeholder="Track ID / Speaker"
                list={`speaker-options-${id}`}
              />
              <datalist id={`speaker-options-${id}`}>
                <option value="Main Speaker (Talker)" />
                <option value="Wide Stage Shot" />
                <option value="Song 85" />
                <option value="Chairman Stage Right" />
                <option value="Chairman Stage Left" />
                <option value="Interview/Demo Stage Left" />
                <option value="Interview/Demo Stage Right" />
              </datalist>
            </div>
            <div className="p-2 italic">
              <input
                className="w-full bg-transparent border-none p-0 focus:ring-0 italic"
                value={content.cueDesc || ''}
                onChange={(e) => update('cueDesc', e.target.value)}
                placeholder="Description/Action"
                list={`action-options-${id}`}
              />
              <datalist id={`action-options-${id}`}>
                <option value="Transition Shot" />
                <option value="Talk" />
                <option value="When Speaker asks questions" />
                <option value="Interview/Demo" />
                <option value="Talk Continues" />
                <option value="Play Song with on screen text" />
                <option value="Chairman Introduces song" />
                <option value="Chairman introduces talk" />
                <option value="Chairman at Lectern" />
              </datalist>
            </div>
          </div>
        );

      case SegmentType.Speaker:
        return (
          <div className="border border-dotted border-gray-400 p-3 text-sm my-2 hover:bg-white transition-colors">
            <div className="text-sheet-green font-bold text-xs uppercase mb-1">Speaker</div>
            <textarea
              className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none"
              rows={2}
              value={content.text || ''}
              onChange={(e) => update('text', e.target.value)}
              placeholder="Speaker notes or script..."
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case SegmentType.Diagram:
        return (
          <div className="my-4">
            <StageDiagram
              items={content.stageItems || []}
              onChange={(items) => update('stageItems', items)}
            />
          </div>
        );

      case SegmentType.PageBreak:
        return (
          <div className="my-4 border-t-4 border-gray-300 border-dashed relative h-8 flex items-center justify-center print:hidden bg-gray-50">
            <span className="text-xs text-gray-400 uppercase font-bold bg-gray-50 px-2">Page Break (Print Only)</span>
            <div className="absolute inset-0" style={{ pageBreakAfter: 'always' }}></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative group transition-all rounded-sm ${type === SegmentType.PageBreak ? 'block' : ''}`}>
      {/* Controls: Top Right with high z-index */}
      <div className={`absolute right-2 top-2 z-[100] flex items-center gap-1 transition-opacity print:hidden ${showInsertMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="flex items-center bg-white shadow-sm border border-gray-200 rounded-md p-0.5">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowInsertMenu(!showInsertMenu); }}
              className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Insert Row Below"
            >
              <Plus size={14} />
            </button>

            {showInsertMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[120px]">
                <button onClick={() => { onInsertAfter(id, SegmentType.Note); setShowInsertMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs">Note</button>
                <button onClick={() => { onInsertAfter(id, SegmentType.TimeBox); setShowInsertMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs">Time Box</button>
                <button onClick={() => { onInsertAfter(id, SegmentType.Cue); setShowInsertMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs">Cue</button>
                <button onClick={() => { onInsertAfter(id, SegmentType.Speaker); setShowInsertMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs">Speaker</button>
                <button onClick={() => { onInsertAfter(id, SegmentType.Diagram); setShowInsertMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs">Diagram</button>
                <button onClick={() => { onInsertAfter(id, SegmentType.PageBreak); setShowInsertMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs">Page Break</button>
              </div>
            )}
          </div>
          <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMove(id, 'up'); }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Move Up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMove(id, 'down'); }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Move Down"
          >
            <ArrowDown size={14} />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Row"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};