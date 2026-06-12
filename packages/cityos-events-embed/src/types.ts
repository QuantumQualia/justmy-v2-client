export interface CityOsEventDto {
  title: string;
  venue: string;
  imageUrl: string;
  ticketUrl?: string | null;
  startAt: string;
  venuePostalCode?: string | null;
}

export interface CityOsEventsResponseDto {
  marketName: string;
  marketCity?: string | null;
  marketSiteTitle?: string | null;
  events: CityOsEventDto[];
  totalCount: number;
}
