export interface Newsletter {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  url: string;
  source: 'school' | 'pta';
  /** Preview image from Mailchimp HTML or Smore og:image when available. */
  imageUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  description?: string;
  source?: 'school' | 'pta';
}
