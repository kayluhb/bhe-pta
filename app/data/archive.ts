export interface ArchiveItem {
  id: string;
  title: string;
  description?: string;
  type: "image" | "pdf" | "document";
  r2Key: string;
  thumbnailR2Key?: string;
  date?: string;
}

export interface ArchiveYear {
  year: string;
  description?: string;
  items: ArchiveItem[];
}

export const archiveData: ArchiveYear[] = [
  {
    year: "2024-2025",
    description: "A year of growth and community spirit",
    items: [
      {
        id: "2025-carnival-flyer",
        title: "Spring Carnival Flyer",
        type: "pdf",
        r2Key: "archive/2024-2025/carnival-flyer.pdf",
        date: "2025-04-15",
      },
      {
        id: "2025-field-day",
        title: "Field Day Photos",
        type: "image",
        r2Key: "archive/2024-2025/field-day.jpg",
        thumbnailR2Key: "archive/2024-2025/field-day-thumb.jpg",
        date: "2025-05-10",
      },
    ],
  },
  {
    year: "2023-2024",
    description: "Celebrating our Eagles community",
    items: [
      {
        id: "2024-newsletter-spring",
        title: "Spring Newsletter",
        type: "pdf",
        r2Key: "archive/2023-2024/spring-newsletter.pdf",
        date: "2024-03-01",
      },
      {
        id: "2024-carnival-photos",
        title: "Carnival Photo Collage",
        type: "image",
        r2Key: "archive/2023-2024/carnival-collage.jpg",
        thumbnailR2Key: "archive/2023-2024/carnival-collage-thumb.jpg",
        date: "2024-04-20",
      },
      {
        id: "2024-fall-fest",
        title: "Fall Festival Flyer",
        type: "image",
        r2Key: "archive/2023-2024/fall-fest-flyer.jpg",
        date: "2024-10-15",
      },
    ],
  },
  {
    year: "2022-2023",
    items: [
      {
        id: "2023-yearbook-cover",
        title: "Yearbook Cover",
        type: "image",
        r2Key: "archive/2022-2023/yearbook-cover.jpg",
        date: "2023-05-20",
      },
    ],
  },
];
