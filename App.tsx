import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileText, Monitor, Mic, Clock, Type, Scissors, Image as ImageIcon, Download, Upload, RotateCcw, LayoutTemplate, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Segment, SegmentType, SegmentContent } from './types';
import { INITIAL_SEGMENTS, CIRCUIT_ASSEMBLY_2025 } from './constants';
import { SegmentRow } from './components/SegmentRow';

// Safer ID generator that works in all contexts (even non-secure http)
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [segments, setSegments] = useState<Segment[]>(() => {
    try {
      const saved = localStorage.getItem('runSheetData');
      return saved ? JSON.parse(saved) : INITIAL_SEGMENTS;
    } catch (e) {
      return INITIAL_SEGMENTS;
    }
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(segments.length === 0);

  useEffect(() => {
    localStorage.setItem('runSheetData', JSON.stringify(segments));
    // Show welcome modal when segments become empty
    if (segments.length === 0) {
      setShowWelcomeModal(true);
    }
  }, [segments]);

  const addSegment = (type: SegmentType) => {
    const newSegment: Segment = {
      id: generateId(),
      type,
      content: {
        isMedia: type === SegmentType.Cue ? true : undefined,
        stageItems: type === SegmentType.Diagram ? [] : undefined
      }
    };
    setSegments([...segments, newSegment]);

    // Scroll to bottom after add
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const updateSegment = (id: string, content: SegmentContent) => {
    // Clean up title by removing "stage layout" (case-insensitive)
    const cleanedContent = { ...content };
    if (cleanedContent.title) {
      cleanedContent.title = cleanedContent.title.replace(/stage\s+layout/gi, '').trim();
    }

    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, content: cleanedContent } : seg));
  };

  const removeSegment = (id: string) => {
    setSegments(prev => prev.filter(seg => seg.id !== id));
  };

  const moveSegment = (id: string, dir: 'up' | 'down') => {
    const index = segments.findIndex(s => s.id === id);
    if ((dir === 'up' && index === 0) || (dir === 'down' && index === segments.length - 1)) return;

    const newSegments = [...segments];
    const swapIndex = dir === 'up' ? index - 1 : index + 1;
    [newSegments[index], newSegments[swapIndex]] = [newSegments[swapIndex], newSegments[index]];
    setSegments(newSegments);
  };

  const insertSegmentAfter = (id: string, type: SegmentType) => {
    const index = segments.findIndex(s => s.id === id);
    const newSegment: Segment = {
      id: generateId(),
      type,
      content: {}
    };
    const newSegments = [...segments];
    newSegments.splice(index + 1, 0, newSegment);
    setSegments(newSegments);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetTemplate = () => {
    setSegments(INITIAL_SEGMENTS);
  };

  const loadTemplate = (template: Segment[]) => {
    // Deep copy to ensure fresh IDs
    const freshData = template.map(s => ({ ...s, id: generateId() }));
    setSegments(freshData);
    setShowTemplates(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(segments, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Format date as YYYY-MM-DD
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `run-sheet-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset? This will clear all content and cannot be undone.')) {
      setSegments([]);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const processPdfWithGemini = async (file: File) => {
    if (!process.env.API_KEY) {
      alert("System Error: API Key is missing. Please contact the administrator.");
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const prompt = `
            You are a Run Sheet Parser. I will provide a PDF image/document of a stage run sheet.
            Convert the visible content into a JSON array of "Segments" matching this TypeScript structure:

            type SegmentType = 'HEADER' | 'NOTE' | 'TIME_BOX' | 'CUE' | 'SPEAKER' | 'DIAGRAM';

            interface Segment {
              type: SegmentType;
              content: {
                // For HEADER (Top of page, titles)
                title?: string;
                subtitle?: string;
                date?: string;

                // For NOTE (General instructions) or SPEAKER (Spoken text) or TIME_BOX (Events with time)
                text?: string;

                // For TIME_BOX
                time?: string; // e.g. "9:30"

                // For CUE (Rows with Camera, Media, Track info)
                cueLabel?: string; // e.g., "Camera 1", "Media"
                cueId?: string;    // e.g., "Main Speaker", "Track 001"
                cueDesc?: string;  // e.g., "Invites audience", "Theme Video"
                isMedia?: boolean; // true if it is a Media/Video/Track cue, false for Camera/Lighting

                // For DIAGRAM
                // Just return an empty array for stageItems, I cannot parse coordinates yet.
                stageItems?: [];
              }
            }
            
            Parsing Rules:
            1. Identify the main Convention Title/Theme at the top as a HEADER.
            2. Identify items starting with a time (e.g. "9:30") as TIME_BOX. The description goes in 'text'.
            3. Identify tabular rows with "Camera", "Media", "Track", "Preset" as CUE segments. 
               - 'cueLabel' is the first column (e.g. "Camera 1 Preset 1").
               - 'cueId' is the middle column (e.g. "Main Speaker").
               - 'cueDesc' is the right column (e.g. "Invites audience").
            4. Identify blocks of text instructions as NOTE.
            5. Identify specific script lines or "SPEAKER" blocks as SPEAKER.
            6. If you see a diagram/image of a stage, insert a NOTE segment with text "[Stage Diagram detected - Please add manually]".
            7. Return ONLY the JSON array. Do not wrap in markdown code blocks.
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
              parts: [
                { inlineData: { mimeType: file.type, data: base64Data } },
                { text: prompt }
              ]
            },
            config: { responseMimeType: 'application/json' }
          });

          let responseText = response.text;
          if (!responseText) throw new Error("No response from AI");

          // Clean up potential markdown formatting if the model adds it despite instructions
          if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json/, '').replace(/```$/, '');
          }

          const parsedSegments = JSON.parse(responseText);

          if (!Array.isArray(parsedSegments)) {
            throw new Error("AI did not return an array.");
          }

          // Post-process to add valid IDs and ensure content exists
          const segmentsWithIds = parsedSegments.map((s: any) => {
            const cleanedContent = { ...s.content };

            // Remove "stage layout" from title (case-insensitive)
            if (cleanedContent.title) {
              cleanedContent.title = cleanedContent.title.replace(/stage\s+layout/gi, '').trim();
            }

            return {
              ...s,
              id: generateId(),
              content: cleanedContent
            };
          });

          // Remove duplicate headers - keep only the first one
          // Also convert stage diagram notes to actual Diagram segments
          // Also convert session labels (MORNING, AFTERNOON) to Header segments
          let hasSeenHeader = false;
          const filteredSegments = segmentsWithIds.filter((segment: Segment) => {
            if (segment.type === SegmentType.Header) {
              if (hasSeenHeader) {
                return false; // Skip this header
              }
              hasSeenHeader = true;
              return true; // Keep the first header
            }
            return true; // Keep all non-header segments
          }).map((segment: Segment) => {
            // Convert stage diagram notes to actual Diagram segments
            if (segment.type === SegmentType.Note &&
              segment.content.text &&
              /stage\s+diagram/i.test(segment.content.text)) {
              return {
                ...segment,
                type: SegmentType.Diagram,
                content: { items: [] } // Empty diagram that user can populate
              };
            }

            // Convert session labels to Header segments
            if (segment.type === SegmentType.Note && segment.content.text) {
              const text = segment.content.text.trim();
              // Check if it's a session label (MORNING, AFTERNOON, EVENING, etc.)
              if (/^(morning|afternoon|evening|session\s+\d+)$/i.test(text)) {
                return {
                  ...segment,
                  type: SegmentType.Header,
                  content: { subtitle: text.toUpperCase() }
                };
              }
            }

            return segment;
          });

          setSegments(filteredSegments);

        } catch (err) {
          console.error("Gemini processing error:", err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          alert(`Failed to process document layout. Error: ${errorMessage}`);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        alert("Error reading file.");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Unexpected error starting import.");
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Standard JSON Import
    if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            setSegments(parsed);
          } else {
            alert("Invalid file format: The file must contain a list of segments.");
          }
        } catch (err) {
          console.error("Error parsing JSON", err);
          alert("Error reading file. Please ensure it is a valid JSON file.");
        }
      };
      reader.readAsText(file);
    }
    // AI Import for PDF
    else if (fileName.endsWith('.pdf')) {
      processPdfWithGemini(file);
    }
    else {
      alert("Unsupported file type. Please upload a .json (Run Sheet) or .pdf (for AI processing).");
    }

    event.target.value = ''; // Reset
  };

  return (
    <div className="min-h-screen pb-20" onClick={() => setShowTemplates(false)}>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-black bg-opacity-70 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-opacity">
          <Loader2 size={64} className="animate-spin mb-6 text-blue-400" />
          <h2 className="text-2xl font-bold">Scanning Document</h2>
          <p className="text-gray-300 mt-2 text-center max-w-md">
            Our AI is analyzing the layout of your PDF.<br />
            This may take a few seconds...
          </p>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        className="hidden"
        accept=".json,.pdf"
      />

      {/* Top Bar - Hidden on print */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AV Run Sheet Builder Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-bold text-gray-800">AV Run Sheet Builder</h1>
          </div>
          <div className="flex gap-2 items-center">

            <button
              onClick={handleImportClick}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              title="Load JSON or PDF"
            >
              <Upload size={14} />
              Import
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              title="Clear all content and start fresh"
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 overflow-x-auto">
          <div className="max-w-5xl mx-auto flex gap-2">
            <span className="text-xs font-semibold uppercase text-gray-400 self-center mr-2">Add Row:</span>

            <ToolButton icon={<Type size={16} />} label="Header" onClick={() => addSegment(SegmentType.Header)} />
            <ToolButton icon={<Clock size={16} />} label="Time/Title" onClick={() => addSegment(SegmentType.TimeBox)} />
            <ToolButton icon={<Monitor size={16} />} label="Cue" onClick={() => addSegment(SegmentType.Cue)} />
            <ToolButton icon={<Mic size={16} />} label="Speaker" onClick={() => addSegment(SegmentType.Speaker)} />
            <ToolButton icon={<ImageIcon size={16} />} label="Diagram" onClick={() => addSegment(SegmentType.Diagram)} />
            <ToolButton icon={<FileText size={16} />} label="Note" onClick={() => addSegment(SegmentType.Note)} />
            <div className="w-px bg-gray-300 mx-2"></div>
            <ToolButton icon={<Scissors size={16} />} label="Page Break" onClick={() => addSegment(SegmentType.PageBreak)} />
          </div>
        </div>
      </div>

      {/* Main Document Canvas */}
      <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] my-8 shadow-lg print:shadow-none print:my-0 print:w-full print:max-w-none">
        <div className="p-[10mm] print:p-0">
          {segments.map(segment => (
            <div key={segment.id} className={segment.type === SegmentType.PageBreak ? 'break-after-page' : ''}>
              <SegmentRow
                segment={segment}
                onChange={updateSegment}
                onRemove={removeSegment}
                onMove={moveSegment}
                onInsertAfter={insertSegmentAfter}
              />
            </div>
          ))}

          {segments.length === 0 && (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p>Empty Run Sheet</p>
              <p className="text-sm">Use the toolbar above to add segments or Import a template.</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Footer (Hidden on print) */}
      <div className="text-center text-gray-400 text-sm pb-8 print:hidden">
        <p>Pro Tip: Use the browser print dialog (Ctrl+P) to Save as PDF.</p>
        <p>Background graphics option must be enabled in print settings for colors to appear.</p>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] print:hidden">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Welcome to Run Sheet Builder</h2>
            <p className="text-gray-600 mb-6 text-center">How would you like to get started?</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handleImportClick();
                  setShowWelcomeModal(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Upload size={24} />
                <div className="flex flex-col items-start">
                  <span className="text-base">Import PDF Runsheet</span>
                  <span className="text-xs font-normal opacity-80">S-343 or Similar</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium"
              >
                <FileText size={20} />
                <span>Blank Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all text-xs font-medium whitespace-nowrap"
  >
    {icon}
    {label}
  </button>
);

export default App;