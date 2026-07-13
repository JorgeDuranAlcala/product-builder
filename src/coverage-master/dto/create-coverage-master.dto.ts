import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordStatus, SumRule } from '@prisma/client';

export class CreateCoverageMasterDto {
  @ApiProperty()
  @IsInt()
  masterBranchId!: number;

  @ApiProperty()
  @IsInt()
  masterCoverageId!: number;

  @ApiProperty()
  @IsInt()
  currencyId!: number;

  @ApiProperty()
  @IsInt()
  internalBranchId!: number;

  @ApiProperty()
  @IsInt()
  internalCoverageId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  dependsOnCoverageId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  compareToCoverageId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  reinsuranceContractId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  reinsuranceBranchId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  pcndBranchCode?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  pcndCoverageCode?: number;

  @ApiPropertyOptional({ enum: SumRule })
  @IsOptional()
  @IsEnum(SumRule)
  reinsuranceSumRule?: SumRule;

  @ApiPropertyOptional({ enum: SumRule })
  @IsOptional()
  @IsEnum(SumRule)
  receiptSumRule?: SumRule;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  calculationRoutine?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inputProc?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  outputProc?: boolean;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
