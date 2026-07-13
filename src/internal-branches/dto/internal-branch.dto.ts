import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentMaskType, RecordStatus } from '@prisma/client';

export class CreateInternalBranchDto {
  @ApiProperty()
  @IsInt()
  code!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  masterBranchId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  imageHandling?: boolean;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class DocumentCounterDto {
  @ApiProperty()
  @IsString()
  concept!: string;

  @ApiProperty()
  @IsString()
  value!: string;
}

export class DocumentMaskSegmentDto {
  @ApiProperty()
  @IsInt()
  position!: number;

  @ApiProperty()
  @IsString()
  token!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useSeparator?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  separator?: string;
}

export class DocumentMaskDto {
  @ApiProperty({ enum: DocumentMaskType })
  @IsEnum(DocumentMaskType)
  type!: DocumentMaskType;

  @ApiProperty({ type: [DocumentMaskSegmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentMaskSegmentDto)
  segments!: DocumentMaskSegmentDto[];
}

export class InternalBranchSetupDto {
  @ApiProperty({ type: [DocumentCounterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentCounterDto)
  counters!: DocumentCounterDto[];

  @ApiProperty({ type: [DocumentMaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentMaskDto)
  masks!: DocumentMaskDto[];
}
