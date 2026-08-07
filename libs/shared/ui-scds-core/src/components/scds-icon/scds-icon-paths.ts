/**
 * Original, hand-drawn 24x24 stroke-icon path data (basic primitives --
 * circles/rects/lines/simple paths, not vendored from any third-party
 * icon set) so scds-icon has zero runtime/license dependency. Every icon
 * is drawn with stroke="currentColor" so it inherits color from CSS
 * context (nav, badges, links) -- see scds-icon.tsx.
 */
export type ScdsIconName =
  | 'home'
  | 'finance'
  | 'briefcase'
  | 'heart'
  | 'activity'
  | 'plane'
  | 'book'
  | 'message'
  | 'document'
  | 'user'
  | 'user-check'
  | 'log-out'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'menu'
  | 'close'
  | 'info-circle'
  | 'check-circle'
  | 'warning-triangle'
  | 'alert-circle'
  | 'shield'
  | 'arrow-right'
  | 'more-horizontal';

export const SCDS_ICON_PATHS: Record<ScdsIconName, string> = {
  home: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1Z"/>',
  finance:
    '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.25c0-1.24-1.34-2.25-3-2.25s-3 .87-3 2.1c0 3 6 1.4 6 4.4 0 1.24-1.34 2.1-3 2.1s-3-1.01-3-2.25"/>',
  briefcase:
    '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8.5 7.5v-2a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2"/><path d="M3 13h18"/>',
  heart:
    '<path d="M12 20.5 4.6 13.2a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5Z"/>',
  activity: '<polyline points="2.5,12.5 6.5,12.5 9,5 14,20 16.5,12.5 21.5,12.5"/>',
  plane: '<path d="m3 13 18-8-6.5 18-3-8-8.5-2Z"/>',
  book: '<path d="M4 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-1.5H4Z"/><path d="M20 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-1.5h6Z"/>',
  message: '<path d="M4 5h16v11H9l-4 4v-4H4Z"/>',
  document:
    '<path d="M6 3h9l3 3v15H6Z"/><path d="M15 3v3h3"/><path d="M9 12h6M9 15.5h6M9 8.5h3"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5"/>',
  'user-check':
    '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="m15.5 12.5 2 2 3-3.5"/>',
  'log-out':
    '<path d="M10 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/><path d="M15.5 8.5 20 12l-4.5 3.5"/><path d="M20 12H9"/>',
  'chevron-down': '<polyline points="5,9 12,16 19,9"/>',
  'chevron-right': '<polyline points="9,5 16,12 9,19"/>',
  'chevron-left': '<polyline points="15,5 8,12 15,19"/>',
  menu: '<line x1="4" y1="6.5" x2="20" y2="6.5"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17.5" x2="20" y2="17.5"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  'info-circle': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.75" r="0.5" fill="currentColor" stroke="none"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><polyline points="8,12.5 11,15.5 16,9"/>',
  'warning-triangle':
    '<path d="M12 4 2.5 20h19Z"/><line x1="12" y1="10.5" x2="12" y2="14.5"/><circle cx="12" cy="17.25" r="0.5" fill="currentColor" stroke="none"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.25" r="0.5" fill="currentColor" stroke="none"/>',
  shield: '<path d="M12 3.5 19 6.5v5.5c0 5-3 8-7 9.5-4-1.5-7-4.5-7-9.5V6.5Z"/>',
  'arrow-right': '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13,6 19,12 13,18"/>',
  'more-horizontal':
    '<circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none"/>',
};
