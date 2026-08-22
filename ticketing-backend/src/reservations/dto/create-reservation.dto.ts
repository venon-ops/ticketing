import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  event_id: string;

  @IsUUID()
  ticket_phase_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}