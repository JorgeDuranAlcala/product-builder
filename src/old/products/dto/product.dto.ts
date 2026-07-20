import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty()
  @IsDateString()
  from!: string;

  @ApiProperty()
  @IsDateString()
  to!: string;
}

export class ProductCoverageTariffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  internalTariffId?: number;

  @ApiProperty()
  @IsNumber()
  minSumInsured!: number;

  @ApiProperty()
  @IsNumber()
  maxSumInsured!: number;

  @ApiProperty()
  @IsNumber()
  premium!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class ProductCoverageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  coverageMasterId?: number;

  @ApiProperty()
  @IsInt()
  internalCoverageId!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  validFrom!: string;

  @ApiProperty()
  @IsDateString()
  validTo!: string;

  @ApiProperty({ type: ProductCoverageTariffDto })
  @ValidateNested()
  @Type(() => ProductCoverageTariffDto)
  tariff!: ProductCoverageTariffDto;
}

export class CreateProductWizardDto {
  @ApiProperty()
  @IsInt()
  masterBranchId!: number;

  @ApiProperty()
  @IsInt()
  internalBranchId!: number;

  @ApiProperty()
  @IsString()
  planName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subPlanName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsQuickEmission?: boolean;

  @ApiProperty()
  @IsInt()
  currencyId!: number;

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  contractValidity!: DateRangeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  annualCloseMonth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  premiumGuaranteeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  renewalFrequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  renewalType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emissionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  premiumDueFrequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  premiumDueType?: string;

  @ApiProperty({ type: [ProductCoverageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCoverageDto)
  coverages!: ProductCoverageDto[];
}

export class AssignProducersDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  producerIds!: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  assignToAll?: boolean;
}

export class CertifyProductDto {
  @ApiProperty({ enum: ['QA', 'PRODUCTION'] })
  @IsString()
  environment!: 'QA' | 'PRODUCTION';

  @ApiProperty({ enum: ['PASSED', 'FAILED', 'PENDING'] })
  @IsString()
  status!: 'PASSED' | 'FAILED' | 'PENDING';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
