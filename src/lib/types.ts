export interface EventSummary {
  id: number;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  price: string;
  description: string;
  imageUrl: string;
}

export interface EventsResponse {
  events: EventSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
