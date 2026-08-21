export class Reservation {
  id: string;
  user_id: string;
  place_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}