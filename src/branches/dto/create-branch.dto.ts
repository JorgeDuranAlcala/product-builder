import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordStatus } from '@prisma/client';

export class CreateBranchDto {
  @ApiProperty()
  @IsInt()
  code!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alias1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alias2?: string;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class UpdateBranchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alias1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alias2?: string;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class MasterTariffDto {
  @ApiProperty()
  @IsInt()
  code!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  validFrom!: string;

  @ApiProperty()
  @IsDateString()
  validTo!: string;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class MasterCoverageWizardDto {
  @ApiProperty()
  @IsInt()
  code!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  validFrom!: string;

  @ApiProperty()
  @IsDateString()
  validTo!: string;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @ApiProperty({ type: [MasterTariffDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterTariffDto)
  tariffs!: MasterTariffDto[];
}

export class CreateBranchWizardDto extends CreateBranchDto {
  @ApiProperty({ type: [MasterCoverageWizardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterCoverageWizardDto)
  coverages!: MasterCoverageWizardDto[];
}
