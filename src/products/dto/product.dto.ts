import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ContractCurrency,
  DeductibleType,
  DocumentType,
  EmissionType,
  FlowStepKey,
  FormFieldType,
  ProductBranch,
  ProductStatus,
  RatingVariableType,
  RenewalFrequency,
  RenewalType,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  commercialName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/)
  internalCode!: string;

  @ApiProperty({ enum: ProductBranch })
  @IsEnum(ProductBranch)
  branch!: ProductBranch;

  @ApiProperty({ enum: ContractCurrency })
  @IsEnum(ContractCurrency)
  currency!: ContractCurrency;

  @ApiProperty({ enum: EmissionType })
  @IsEnum(EmissionType)
  emissionType!: EmissionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subPlanCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  vigenciaInicio?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  vigenciaFin?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsQuickEmission?: boolean;

  @ApiPropertyOptional({ enum: RenewalFrequency })
  @IsOptional()
  @IsEnum(RenewalFrequency)
  renewalFrequency?: RenewalFrequency;

  @ApiPropertyOptional({ enum: RenewalType })
  @IsOptional()
  @IsEnum(RenewalType)
  renewalType?: RenewalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  premiumGuaranteeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  annualClosingMonth?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  commercialName?: string;

  @ApiPropertyOptional({ enum: ContractCurrency })
  @IsOptional()
  @IsEnum(ContractCurrency)
  currency?: ContractCurrency;

  @ApiPropertyOptional({ enum: EmissionType })
  @IsOptional()
  @IsEnum(EmissionType)
  emissionType?: EmissionType;

  @ApiPropertyOptional()
  @IsOptional()
  subPlanCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  vigenciaInicio?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  vigenciaFin?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsQuickEmission?: boolean;

  @ApiPropertyOptional({ enum: RenewalFrequency })
  @IsOptional()
  @IsEnum(RenewalFrequency)
  renewalFrequency?: RenewalFrequency;

  @ApiPropertyOptional({ enum: RenewalType })
  @IsOptional()
  @IsEnum(RenewalType)
  renewalType?: RenewalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  premiumGuaranteeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  annualClosingMonth?: number;
}

export class CoverageInputDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isBasicMandatory?: boolean;

  @IsOptional()
  @IsNumber()
  insuredSumFixed?: number;

  @IsOptional()
  @IsNumber()
  insuredSumMin?: number;

  @IsOptional()
  @IsNumber()
  insuredSumMax?: number;

  @IsOptional()
  @IsEnum(DeductibleType)
  deductibleType?: DeductibleType;

  @IsOptional()
  @IsNumber()
  deductibleValue?: number;

  @IsOptional()
  @IsInt()
  waitingPeriodDays?: number;

  @IsOptional()
  @IsNumber()
  tariffPremium?: number;

  @IsOptional()
  @IsString()
  dependsOnCoverageName?: string;

  @IsOptional()
  @IsString()
  reinsuranceContractCode?: string;

  @IsOptional()
  @IsString()
  reinsuranceContractName?: string;

  @IsOptional()
  @IsString()
  reinsuranceBranchCode?: string;

  @IsOptional()
  @IsDateString()
  vigenciaDesde?: string | null;

  @IsOptional()
  @IsDateString()
  vigenciaHasta?: string | null;

  @IsOptional()
  @IsString()
  coberturaInternaCode?: string;

  @IsOptional()
  @IsString()
  tarifaInternaCode?: string;

  @IsOptional()
  @IsString()
  treatmentType?: string;

  @IsOptional()
  @IsString()
  calculationService?: string;
}

export class ReplaceCoveragesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageInputDto)
  coverages!: CoverageInputDto[];
}

export class PlanInputDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsNumber()
  priceFactor!: number;

  @IsBoolean()
  isRecommended!: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  coverageIds!: string[];

  @IsInt()
  sortOrder!: number;
}

export class ReplacePlansDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanInputDto)
  plans!: PlanInputDto[];
}

export class RatingVariableInputDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  name!: string;

  @IsString()
  label!: string;

  @IsEnum(RatingVariableType)
  variableType!: RatingVariableType;

  @IsBoolean()
  required!: boolean;

  @IsInt()
  sortOrder!: number;

  @IsOptional()
  @IsArray()
  options?: string[];
}

export class ReplaceActuarialDto {
  @IsNumber()
  @Min(0.01)
  purePremium!: number;

  @IsNumber()
  @Min(0)
  @Max(99.99)
  administrativeExpenses!: number;

  @IsNumber()
  @Min(0)
  @Max(99.99)
  commissions!: number;

  @IsNumber()
  @Min(0)
  @Max(99.99)
  profitMargin!: number;

  @IsString()
  @MinLength(3)
  actuaryName!: string;

  @IsString()
  @MinLength(5)
  actuaryCedula!: string;

  @IsString()
  @Matches(/^[A-Z0-9-]+$/)
  actuarySudeasegNumber!: string;

  @IsOptional()
  @IsUrl()
  technicalNoteUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingVariableInputDto)
  ratingVariables!: RatingVariableInputDto[];
}

export class ExclusionInputDto {
  @IsString()
  @MinLength(10)
  text!: string;

  @IsInt()
  sortOrder!: number;

  @IsBoolean()
  typographyHighlight!: boolean;
}

export class LegalDocumentInputDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isSimplifiedTemplate?: boolean;
}

export class CommercialChannelInputDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  channelType?: string;
}

export class RequiredDocumentInputDto {
  @IsString()
  documentKey!: string;

  @IsString()
  label!: string;

  @IsBoolean()
  required!: boolean;

  @IsInt()
  sortOrder!: number;
}

export class ReplaceLegalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExclusionInputDto)
  exclusions!: ExclusionInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegalDocumentInputDto)
  documents!: LegalDocumentInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialChannelInputDto)
  commercialChannels?: CommercialChannelInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredDocumentInputDto)
  requiredDocuments!: RequiredDocumentInputDto[];
}

export class FlowStepInputDto {
  @IsEnum(FlowStepKey)
  stepKey!: FlowStepKey;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  shortLabel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  enabled!: boolean;

  @IsBoolean()
  formEnabled!: boolean;

  @IsInt()
  sortOrder!: number;
}

export class FormFieldInputDto {
  @IsString()
  label!: string;

  @IsEnum(FormFieldType)
  fieldType!: FormFieldType;

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsEnum(FlowStepKey)
  stepKey!: FlowStepKey;

  @IsInt()
  sortOrder!: number;
}

export class ReplaceEmissionConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowStepInputDto)
  flowSteps!: FlowStepInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldInputDto)
  formFields!: FormFieldInputDto[];
}

export class WorkflowTransitionDto {
  @IsEnum(ProductStatus)
  toStatus!: ProductStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class WorkflowApproveDto {
  @IsString()
  @MinLength(5)
  @Matches(/^[A-Z0-9/-]+$/)
  numeroProvidenciaSudeaseg!: string;

  @IsDateString()
  fechaGacetaAprobacion!: string;
}

export class SisipConfigDto {
  @IsOptional() @IsString() ramoInternoCode?: string;
  @IsOptional() @IsString() ramoInternoName?: string;
  @IsOptional() @IsString() branchAlias1?: string;
  @IsOptional() @IsString() branchAlias2?: string | null;
  @IsOptional() @IsString() producerCode?: string;
  @IsOptional() @IsString() producerName?: string;
  @IsOptional() @IsBoolean() assignToAllProducers?: boolean;
  @IsOptional() @IsString() counterCotizacion?: string;
  @IsOptional() @IsString() counterPoliza?: string;
  @IsOptional() @IsString() counterRecibo?: string;
  @IsOptional() @IsString() counterSiniestro?: string;
  @IsOptional() @IsString() maskPoliza?: string;
  @IsOptional() @IsString() maskRecibo?: string | null;
  @IsOptional() @IsString() maskSiniestro?: string | null;
}
