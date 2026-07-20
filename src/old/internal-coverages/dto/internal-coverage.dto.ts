import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppliesWhen, RecordStatus, TreatmentType } from '@prisma/client';

export class CreateInternalCoverageDto {
  @ApiProperty()
  @IsInt()
  code!: number;

  @ApiProperty()
  @IsInt()
  internalBranchId!: number;

  @ApiProperty()
  @IsInt()
  masterCoverageId!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverageGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sumInsuredRequiredAtLevel?: boolean;

  @ApiPropertyOptional({ enum: TreatmentType })
  @IsOptional()
  @IsEnum(TreatmentType)
  treatmentType?: TreatmentType;

  @ApiPropertyOptional({ enum: AppliesWhen })
  @IsOptional()
  @IsEnum(AppliesWhen)
  appliesWhen?: AppliesWhen;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calculationForm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sumForm?: string;
}

export class CreateInternalTariffDto {
  @ApiProperty()
  @IsInt()
  code!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  masterTariffId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tariffGroup?: string;

  @ApiPropertyOptional({ enum: TreatmentType })
  @IsOptional()
  @IsEnum(TreatmentType)
  treatmentType?: TreatmentType;

  @ApiPropertyOptional({ enum: AppliesWhen })
  @IsOptional()
  @IsEnum(AppliesWhen)
  appliesWhen?: AppliesWhen;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calculationForm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sumForm?: string;
}

export class InternalCoverageWithTariffDto {
  @ApiProperty({ type: CreateInternalCoverageDto })
  @ValidateNested()
  @Type(() => CreateInternalCoverageDto)
  coverage!: CreateInternalCoverageDto;

  @ApiProperty({ type: CreateInternalTariffDto })
  @ValidateNested()
  @Type(() => CreateInternalTariffDto)
  tariff!: CreateInternalTariffDto;
}
