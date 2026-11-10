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
    imageUrl: 'https://cdn.smore.com/ss/9689/6aeb5694b396cf591ff89139-screenshot-fb_wide.jpg',
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
    imageUrl:
      'https://mcusercontent.com/bec8051159f5dd775329aa6af/images/76ea7d1e-80bd-e4fa-7af1-1f48a321be57.jpeg',
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
    id: 'its-my-park-day',
    title: "BHE: It's My Park Day",
    start: '2026-11-15T09:00:00',
    end: '2026-11-15T12:00:00',
    allDay: false,
    category: 'Community Event',
    description: 'Neighborhood park clean-up with Greenworks',
  },
  {
    id: 'prospective-parent-tour-nov',
    title: 'BHE Prospective Parent Tour',
    start: '2026-11-18T09:00:00',
    end: '2026-11-18T10:00:00',
    allDay: false,
    category: 'Prospective families',
    description: 'Campus tour for prospective families',
  },
  {
    id: 'pta-meeting-nov',
    title: 'BHE PTA Meeting',
    start: '2026-11-18T18:30:00',
    end: '2026-11-18T19:30:00',
    allDay: false,
    category: 'PTA Meeting',
    description: 'Monthly PTA meeting in the cafeteria',
  },
  {
    id: 'spirit-night-torchys',
    title: "Spirit Night at Torchy's Tacos",
    start: '2026-12-05T17:00:00',
    end: '2026-12-05T21:00:00',
    allDay: false,
    category: 'Community Event',
    description: 'Mention BHE and 15% goes to the PTA',
  },
  {
    id: 'winter-break',
    title: 'Winter Break',
    start: '2026-12-21',
    end: '2027-01-05',
    allDay: true,
    category: 'Student Holiday',
  },
  {
    id: 'pta-meeting-jan',
    title: 'PTA General Meeting',
    start: '2027-01-13T18:30:00',
    end: '2027-01-13T19:30:00',
    allDay: false,
    category: 'PTA Meeting',
  },
  {
    id: 'valentines-dance',
    title: "Valentine's Day Dance",
    start: '2027-02-13T17:30:00',
    end: '2027-02-13T19:30:00',
    allDay: false,
    category: 'Community Event',
    description: "Annual BHE Valentine's celebration in the cafeteria",
  },
  {
    id: 'spring-carnival',
    title: 'Spring Carnival',
    start: '2027-03-21T17:30:00',
    end: '2027-03-21T20:30:00',
    allDay: false,
    category: 'Community Event',
    description: 'Our biggest fundraiser of the year!',
  },
];
