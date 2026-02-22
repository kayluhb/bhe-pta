import type {CalendarEvent, Newsletter} from './types';

export const mockNewsletters: Newsletter[] = [
  {
    id: 'eagle-update-2026-02-07',
    title: 'Eagle Update - February 7, 2026',
    date: '2026-02-07',
    excerpt:
      "This week's update from Principal Achtermann covering upcoming events, curriculum updates, and community announcements for Barton Hills Elementary.",
    url: 'https://bartonhills.austinschools.org/news/eagle-update-february-7-2026',
    source: 'school',
  },
  {
    id: 'eagle-update-2026-01-31',
    title: 'Eagle Update - January 31, 2026',
    date: '2026-01-31',
    excerpt:
      'Updates on Science Fair preparations, library book drive, and after-school program schedule changes.',
    url: 'https://bartonhills.austinschools.org/news/eagle-update-january-31-2026',
    source: 'school',
  },
  {
    id: 'eagle-update-2026-01-24',
    title: 'Eagle Update - January 24, 2026',
    date: '2026-01-24',
    excerpt:
      'Information about the upcoming Cultural Arts presentation, PTA meeting recap, and important dates for February.',
    url: 'https://bartonhills.austinschools.org/news/eagle-update-january-24-2026',
    source: 'school',
  },
  {
    id: 'eagle-update-2026-01-17',
    title: 'Eagle Update - January 17, 2026',
    date: '2026-01-17',
    excerpt:
      'Welcome back from winter break! New semester information, registration reminders, and volunteer opportunities.',
    url: 'https://bartonhills.austinschools.org/news/eagle-update-january-17-2026',
    source: 'school',
  },
  {
    id: 'eagle-update-2026-01-10',
    title: 'Eagle Update - January 10, 2026',
    date: '2026-01-10',
    excerpt:
      'First week back highlights, spring semester calendar, and Reflections program deadline reminders.',
    url: 'https://bartonhills.austinschools.org/news/eagle-update-january-10-2026',
    source: 'school',
  },
];

export const mockPtaNewsletters: Newsletter[] = [
  {
    id: 'pta-feb-2026',
    title: 'February PTA Newsletter',
    date: '2026-02-01',
    excerpt:
      "Updates on the Annual Fund progress, Spring Carnival volunteer signups, Spirit Night schedule, and Valentine's Day Dance details.",
    url: '#',
    source: 'pta',
  },
  {
    id: 'pta-jan-2026',
    title: 'January PTA Newsletter',
    date: '2026-01-15',
    excerpt:
      'Happy New Year! Annual Fund kickoff, spring semester volunteer opportunities, and important upcoming dates.',
    url: '#',
    source: 'pta',
  },
  {
    id: 'pta-dec-2025',
    title: 'December PTA Newsletter',
    date: '2025-12-15',
    excerpt:
      'Holiday party recap, winter break information, and a thank you to all fall semester volunteers.',
    url: '#',
    source: 'pta',
  },
  {
    id: 'pta-nov-2025',
    title: 'November PTA Newsletter',
    date: '2025-11-15',
    excerpt:
      'Thanksgiving celebration details, fall carnival fundraiser results, and teacher appreciation week.',
    url: '#',
    source: 'pta',
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: 'african-american-heritage',
    title: 'African American Heritage Month',
    start: '2026-02-01',
    end: '2026-03-01',
    allDay: true,
    category: 'Community Event',
  },
  {
    id: 'valentines-dance',
    title: "Valentine's Day Dance",
    start: '2026-02-14T17:30:00',
    end: '2026-02-14T19:30:00',
    allDay: false,
    category: 'Community Event',
    description: "Annual BHE Valentine's celebration in the cafeteria",
  },
  {
    id: 'pta-meeting-feb',
    title: 'PTA General Meeting',
    start: '2026-02-28T18:30:00',
    end: '2026-02-28T19:30:00',
    allDay: false,
    category: 'Community Event',
    description: 'Monthly PTA meeting in the cafeteria',
  },
  {
    id: 'spirit-night-torchys',
    title: "Spirit Night at Torchy's Tacos",
    start: '2026-03-07T17:00:00',
    end: '2026-03-07T21:00:00',
    allDay: false,
    category: 'Community Event',
    description: 'Mention BHE and 15% goes to the PTA',
  },
  {
    id: 'science-fair',
    title: 'Science Fair',
    start: '2026-03-14T09:00:00',
    end: '2026-03-14T14:00:00',
    allDay: false,
    category: 'Fine Arts',
    description: 'Students present their science projects',
  },
  {
    id: 'spring-break',
    title: 'Spring Break',
    start: '2026-03-16',
    end: '2026-03-20',
    allDay: true,
    category: 'Student Holiday',
  },
  {
    id: 'spring-carnival',
    title: 'Spring Carnival',
    start: '2026-03-21T17:30:00',
    end: '2026-03-21T20:30:00',
    allDay: false,
    category: 'Community Event',
    description: 'Our biggest fundraiser of the year!',
  },
  {
    id: 'pta-meeting-mar',
    title: 'PTA General Meeting',
    start: '2026-03-28T18:30:00',
    end: '2026-03-28T19:30:00',
    allDay: false,
    category: 'Community Event',
  },
  {
    id: 'cultural-arts-apr',
    title: 'Cultural Arts Presentation',
    start: '2026-04-10T10:00:00',
    end: '2026-04-10T11:00:00',
    allDay: false,
    category: 'Fine Arts',
    description: 'Spring visiting artist performance',
  },
  {
    id: 'earth-day',
    title: 'Earth Day Garden Event',
    start: '2026-04-22T09:00:00',
    end: '2026-04-22T12:00:00',
    allDay: false,
    category: 'Community Event',
    description: 'Greenworks garden planting and composting workshop',
  },
];
