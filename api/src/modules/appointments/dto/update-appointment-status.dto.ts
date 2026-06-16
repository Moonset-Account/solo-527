import { IsEnum } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}
