export enum SegmentType {
  Header = 'HEADER',
  Note = 'NOTE',
  TimeBox = 'TIME_BOX',
  Cue = 'CUE',
  Speaker = 'SPEAKER',
  Diagram = 'DIAGRAM',
  PageBreak = 'PAGE_BREAK'
}

export interface StageItem {
  id: string;
  type: string;
  x: number;
  y: number;
}

export interface SegmentContent {
  // Header
  title?: string;
  subtitle?: string;
  date?: string;
  
  // Note / Speaker
  text?: string;
  
  // TimeBox
  time?: string;
  
  // Cue
  cueLabel?: string; // e.g. "Camera 1 Preset 1" or "Media"
  cueId?: string;    // e.g. "Track 001"
  cueDesc?: string;  // e.g. "Convention Theme"
  isMedia?: boolean; // Toggles red text color
  
  // Diagram
  stageItems?: StageItem[];
}

export interface Segment {
  id: string;
  type: SegmentType;
  content: SegmentContent;
}