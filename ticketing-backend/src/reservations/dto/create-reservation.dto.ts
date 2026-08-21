import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  user_id: string;

  @IsString()
  place_id: string;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled';
}