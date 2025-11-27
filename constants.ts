import { Segment, SegmentType } from './types';

export const INITIAL_SEGMENTS: Segment[] = [];

export const CIRCUIT_ASSEMBLY_2025: Segment[] = [
  {
    id: 'ca-header',
    type: SegmentType.Header,
    content: {
      title: 'CIRCUIT ASSEMBLY',
      subtitle: 'WITH BRANCH REPRESENTATIVE | 2025-2026',
      date: 'MORNING SESSION'
    }
  },
  {
    id: 'ca-music',
    type: SegmentType.TimeBox,
    content: {
      time: '9:30',
      text: 'Music'
    }
  },
  {
    id: 'ca-song-1',
    type: SegmentType.TimeBox,
    content: {
      time: '9:40',
      text: 'Song No. 73 and Prayer'
    }
  },
  {
    id: 'ca-chairman-note',
    type: SegmentType.Note,
    content: {
      text: 'Chairman waits at the lectern while the song is introduced.'
    }
  },
  {
    id: 'ca-symposium-intro',
    type: SegmentType.TimeBox,
    content: {
      time: '9:50',
      text: 'Symposium: Maintain Your Joy!'
    }
  },
  {
    id: 'ca-media-cue',
    type: SegmentType.Cue,
    content: {
      cueLabel: 'Media',
      cueId: 'Video 1',
      cueDesc: 'Intro Video',
      isMedia: true
    }
  }
];