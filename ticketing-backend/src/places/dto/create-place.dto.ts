export class CreatePlaceDto {
  name: string;
  date: string;
  price: number;
  capacity: number;

  // IDs des artistes programmés pour cette soirée.
  // Optionnel : une soirée peut être créée sans artiste au départ.
  artist_ids?: string[];
}