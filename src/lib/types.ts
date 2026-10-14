export interface EventSummary {
  id: number;
  title: string;
  category: string;
  categoryId: number;
  city: string;
  cityId: number;
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

export type AdminEvent = EventSummary & { active: boolean };
export interface VisitorIdentity {
  id: number;
  email: string;
  role: "USER";
}

export type AdminSort =
  | "date-asc"
  | "date-desc"
  | "title-asc"
  | "price-asc"
  | "price-desc";
export interface AdminEventsResponse {
  events: AdminEvent[];
  pagination: EventsResponse["pagination"];
  stats: { total: number; active: number; inactive: number };
}

export interface AdminEventQuery {
  q: string;
  status: "all" | "active" | "inactive";
  sort: AdminSort;
  page: number;
  pageSize: number;
}

export interface LookupOption {
  id: number;
  name: string;
}

export type CategoryOption = LookupOption;
export type CatalogResource = "categories" | "cities";
