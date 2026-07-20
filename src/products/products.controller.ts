import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductMutableGuard } from '../common/guards/product-mutable.guard';
import {
  CoverageInputDto,
  CreateProductDto,
  ReplaceActuarialDto,
  ReplaceCoveragesDto,
  ReplaceEmissionConfigDto,
  ReplaceLegalDto,
  ReplacePlansDto,
  SisipConfigDto,
  UpdateProductDto,
  WorkflowApproveDto,
  WorkflowTransitionDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto (wizard paso 0)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto completo' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Actualizar producto (wizard paso 0)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar producto' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/coverages')
  @ApiOperation({ summary: 'Listar coberturas del producto' })
  listCoverages(@Param('id') id: string) {
    return this.productsService.listCoverages(id);
  }

  @Put(':id/coverages')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Reemplazar coberturas (wizard paso 1)' })
  replaceCoverages(
    @Param('id') id: string,
    @Body() dto: ReplaceCoveragesDto,
  ) {
    return this.productsService.replaceCoverages(id, dto);
  }

  @Post(':id/coverages')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Crear cobertura individual' })
  createCoverage(
    @Param('id') id: string,
    @Body() dto: CoverageInputDto,
  ) {
    return this.productsService.createCoverage(id, dto);
  }

  @Delete(':id/coverages/:coverageId')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Eliminar cobertura individual' })
  deleteCoverage(
    @Param('id') id: string,
    @Param('coverageId') coverageId: string,
  ) {
    return this.productsService.deleteCoverage(id, coverageId);
  }

  @Get(':id/plans')
  @ApiOperation({ summary: 'Obtener planes comerciales' })
  getPlans(@Param('id') id: string) {
    return this.productsService.getPlans(id);
  }

  @Put(':id/plans')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Guardar planes comerciales (wizard paso 2)' })
  replacePlans(@Param('id') id: string, @Body() dto: ReplacePlansDto) {
    return this.productsService.replacePlans(id, dto);
  }

  @Put(':id/actuarial')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Guardar actuarial (wizard paso 3)' })
  replaceActuarial(
    @Param('id') id: string,
    @Body() dto: ReplaceActuarialDto,
  ) {
    return this.productsService.replaceActuarial(id, dto);
  }

  @Put(':id/legal')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Guardar bundle legal (wizard paso 4)' })
  replaceLegal(@Param('id') id: string, @Body() dto: ReplaceLegalDto) {
    return this.productsService.replaceLegal(id, dto);
  }

  @Get(':id/emission-config')
  @ApiOperation({ summary: 'Obtener config de emisión (wizard paso 5)' })
  getEmissionConfig(@Param('id') id: string) {
    return this.productsService.getEmissionConfig(id);
  }

  @Put(':id/emission-config')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Guardar config de emisión (wizard paso 5)' })
  replaceEmissionConfig(
    @Param('id') id: string,
    @Body() dto: ReplaceEmissionConfigDto,
  ) {
    return this.productsService.replaceEmissionConfig(id, dto);
  }

  @Get(':id/workflow/validate-submission')
  @ApiOperation({ summary: 'Validar envío SUDEASEG (wizard paso 6)' })
  validateSubmission(@Param('id') id: string) {
    return this.productsService.validateSubmission(id);
  }

  @Post(':id/workflow/transition')
  @ApiOperation({ summary: 'Transición de estado del producto' })
  transition(
    @Param('id') id: string,
    @Body() dto: WorkflowTransitionDto,
  ) {
    return this.productsService.transition(id, dto);
  }

  @Post(':id/workflow/approve')
  @ApiOperation({ summary: 'Aprobar producto SUDEASEG' })
  approve(@Param('id') id: string, @Body() dto: WorkflowApproveDto) {
    return this.productsService.approve(id, dto);
  }

  @Get(':id/sisip')
  @ApiOperation({ summary: 'Obtener config SISIP (opcional)' })
  getSisip(@Param('id') id: string) {
    return this.productsService.getSisip(id);
  }

  @Put(':id/sisip')
  @UseGuards(ProductMutableGuard)
  @ApiOperation({ summary: 'Guardar config SISIP (opcional)' })
  replaceSisip(@Param('id') id: string, @Body() dto: SisipConfigDto) {
    return this.productsService.replaceSisip(id, dto);
  }
}
