import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProducerType, RecordStatus } from '@prisma/client';

export class CreateProducerDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: ProducerType })
  @IsOptional()
  @IsEnum(ProducerType)
  type?: ProducerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legacyCode?: string;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
