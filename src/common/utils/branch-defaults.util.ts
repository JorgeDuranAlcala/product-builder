import {
  ProductBranch,
  ProductStatus,
  FlowStepKey,
  FormFieldType,
} from '@prisma/client';

export interface GuardrailViolation {
  code: string;
  message: string;
}

export function validateSubmissionGuardrails(product: {
  branch: ProductBranch;
  status: ProductStatus;
  coverages: { isBasicMandatory: boolean }[];
  exclusions: { typographyHighlight: boolean }[];
  actuarialData: {
    actuarySudeasegNumber: string;
    administrativeExpenses: { toNumber(): number } | number;
    commissions: { toNumber(): number } | number;
    profitMargin: { toNumber(): number } | number;
  } | null;
  commercialChannels: unknown[];
  legalDocuments: { isSimplifiedTemplate: boolean }[];
}): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  if (
    !product.actuarialData?.actuarySudeasegNumber?.trim()
  ) {
    violations.push({
      code: 'ACTUARY_REQUIRED',
      message:
        'El producto debe tener un actuario con número de registro SUDEASEG válido asignado.',
    });
  }

  if (
    !product.exclusions.length ||
    product.exclusions.some((e) => !e.typographyHighlight)
  ) {
    violations.push({
      code: 'EXCLUSIONS_HIGHLIGHT',
      message:
        'Todas las exclusiones deben existir y tener typographyHighlight = true.',
    });
  }

  if (!product.coverages.some((c) => c.isBasicMandatory)) {
    violations.push({
      code: 'MANDATORY_COVERAGE',
      message:
        'Debe existir al menos una cobertura con is_basic_mandatory = true.',
    });
  }

  if (product.actuarialData) {
    const admin = Number(product.actuarialData.administrativeExpenses);
    const comm = Number(product.actuarialData.commissions);
    const profit = Number(product.actuarialData.profitMargin);
    if (admin + comm + profit >= 100) {
      violations.push({
        code: 'LOAD_FACTOR_INVALID',
        message:
          'La suma de gastos administrativos, comisiones y utilidad debe ser menor a 100%.',
      });
    }
  }

  if (
    product.branch === ProductBranch.INCLUSIVO &&
    product.commercialChannels.length === 0
  ) {
    violations.push({
      code: 'INCLUSIVO_CHANNEL',
      message: 'El ramo INCLUSIVO requiere al menos un canal comercial.',
    });
  }

  if (
    product.branch === ProductBranch.INCLUSIVO &&
    !product.legalDocuments.some((d) => d.isSimplifiedTemplate)
  ) {
    violations.push({
      code: 'INCLUSIVO_TEMPLATE',
      message: 'El ramo INCLUSIVO requiere plantilla simplificada en documentos legales.',
    });
  }

  return violations;
}

const BASE_FLOW_STEPS: {
  stepKey: FlowStepKey;
  label: string;
  shortLabel: string;
  description: string;
  sortOrder: number;
}[] = [
  {
    stepKey: FlowStepKey.CLIENT_DATA,
    label: 'Datos cliente',
    shortLabel: 'Cliente',
    description: 'Información legal del tomador.',
    sortOrder: 0,
  },
  {
    stepKey: FlowStepKey.RISK_DATA,
    label: 'Datos del riesgo',
    shortLabel: 'Riesgo',
    description: 'Variables específicas del producto.',
    sortOrder: 1,
  },
  {
    stepKey: FlowStepKey.PLANS_COVERAGES,
    label: 'Planes y coberturas',
    shortLabel: 'Planes',
    description: 'Selección de plan comercial.',
    sortOrder: 2,
  },
  {
    stepKey: FlowStepKey.DOCUMENTS_OCR,
    label: 'Documentos OCR',
    shortLabel: 'Documentos',
    description: 'Recaudos con lectura automática.',
    sortOrder: 3,
  },
  {
    stepKey: FlowStepKey.DIGITAL_SIGNATURE,
    label: 'Firma digital',
    shortLabel: 'Firma',
    description: 'Consentimiento y firma.',
    sortOrder: 4,
  },
  {
    stepKey: FlowStepKey.AI_INSPECTION,
    label: 'Inspección IA',
    shortLabel: 'Inspección',
    description: 'Evidencia fotográfica.',
    sortOrder: 5,
  },
  {
    stepKey: FlowStepKey.TECHNICAL_APPROVAL,
    label: 'Aprobación técnica',
    shortLabel: 'Aprobación',
    description: 'Revisión interna.',
    sortOrder: 6,
  },
  {
    stepKey: FlowStepKey.PAYMENT,
    label: 'Pago habilitado',
    shortLabel: 'Pago',
    description: 'Forma de pago.',
    sortOrder: 7,
  },
  {
    stepKey: FlowStepKey.FINISHED,
    label: 'Finalizado',
    shortLabel: 'Listo',
    description: 'Póliza emitida.',
    sortOrder: 8,
  },
];

function branchFlowEnabled(stepKey: FlowStepKey, branch: ProductBranch): boolean {
  if (stepKey === FlowStepKey.DIGITAL_SIGNATURE) {
    return branch !== ProductBranch.RCV_OBLIGATORIO;
  }
  if (stepKey === FlowStepKey.AI_INSPECTION) {
    return (
      branch === ProductBranch.AUTOMOVIL ||
      branch === ProductBranch.RCV_OBLIGATORIO ||
      branch === ProductBranch.PATRIMONIAL
    );
  }
  if (stepKey === FlowStepKey.TECHNICAL_APPROVAL) {
    return branch !== ProductBranch.RCV_OBLIGATORIO;
  }
  return true;
}

export function defaultFlowSteps(branch: ProductBranch) {
  return BASE_FLOW_STEPS.map((step) => ({
    ...step,
    enabled: branchFlowEnabled(step.stepKey, branch),
    formEnabled:
      step.stepKey === FlowStepKey.CLIENT_DATA ||
      step.stepKey === FlowStepKey.RISK_DATA,
  }));
}

export interface DefaultFormField {
  label: string;
  fieldType: FormFieldType;
  required: boolean;
  stepKey: FlowStepKey;
  sortOrder: number;
}

export function defaultFormFields(branch: ProductBranch): DefaultFormField[] {
  const clientFields: DefaultFormField[] = [
    { label: 'Razón social / Tomador', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.CLIENT_DATA, sortOrder: 0 },
    { label: 'RIF', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.CLIENT_DATA, sortOrder: 1 },
    { label: 'Cédula representante', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.CLIENT_DATA, sortOrder: 2 },
    { label: 'Teléfono', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.CLIENT_DATA, sortOrder: 3 },
    { label: 'Email', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.CLIENT_DATA, sortOrder: 4 },
    { label: 'Dirección fiscal', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.CLIENT_DATA, sortOrder: 5 },
  ];

  const riskByBranch: Record<ProductBranch, DefaultFormField[]> = {
    [ProductBranch.PATRIMONIAL]: [
      { label: 'Nombre del edificio', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 0 },
      { label: 'Cantidad de apartamentos', fieldType: FormFieldType.NUMBER, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 1 },
    ],
    [ProductBranch.AUTOMOVIL]: [
      { label: 'Placa', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 0 },
      { label: 'Marca', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 1 },
      { label: 'Modelo', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 2 },
    ],
    [ProductBranch.RCV_OBLIGATORIO]: [
      { label: 'Placa', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 0 },
    ],
    [ProductBranch.SALUD]: [
      { label: 'Edad del asegurado', fieldType: FormFieldType.NUMBER, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 0 },
    ],
    [ProductBranch.VIDA]: [
      { label: 'Edad del asegurado', fieldType: FormFieldType.NUMBER, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 0 },
    ],
    [ProductBranch.INCLUSIVO]: [
      { label: 'Comunidad / zona', fieldType: FormFieldType.TEXT, required: true, stepKey: FlowStepKey.RISK_DATA, sortOrder: 0 },
    ],
  };

  return [...clientFields, ...riskByBranch[branch]];
}

export function defaultPlans(
  branch: ProductBranch,
  coverages: { id: string; name: string }[],
) {
  const coverageIds = coverages.map((c) => c.id);
  const coverageLabels = coverages.map((c) => c.name);

  if (branch === ProductBranch.RCV_OBLIGATORIO) {
    return [
      {
        name: 'Plan RCV Obligatorio',
        description: 'Plan único regulado',
        badge: 'Obligatorio',
        priceFactor: 1,
        isRecommended: true,
        coverageIds,
        coverageLabels,
        sortOrder: 0,
      },
    ];
  }

  return [
    {
      name: 'Plan Estándar',
      description: 'Plan comercial configurable',
      badge: 'Recomendado',
      priceFactor: 1,
      isRecommended: true,
      coverageIds,
      coverageLabels,
      sortOrder: 0,
    },
    {
      name: 'Plan Básico',
      description: null,
      badge: 'Esencial',
      priceFactor: 0.85,
      isRecommended: false,
      coverageIds: coverageIds.slice(0, 1),
      coverageLabels: coverageLabels.slice(0, 1),
      sortOrder: 1,
    },
    {
      name: 'Plan Premium',
      description: 'Máxima cobertura',
      badge: 'Premium',
      priceFactor: 1.25,
      isRecommended: false,
      coverageIds,
      coverageLabels,
      sortOrder: 2,
    },
  ];
}

export function applyBranchFlagsOnCreate(branch: ProductBranch) {
  const simplified =
    branch === ProductBranch.RCV_OBLIGATORIO ||
    branch === ProductBranch.INCLUSIVO;

  return {
    simplifiedContract: simplified,
    uniformConditions: simplified,
    lockedGeneralConditions: branch === ProductBranch.RCV_OBLIGATORIO,
  };
}
