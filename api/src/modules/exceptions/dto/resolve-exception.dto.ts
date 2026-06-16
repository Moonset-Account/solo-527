import { IsString, IsNumber } from 'class-validator';

export class ResolveExceptionDto {
  @IsNumber()
  resolvedBy: number;

  @IsString()
  resolutionNote: string;
}
