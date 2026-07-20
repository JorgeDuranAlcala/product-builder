import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import {
  AssignProducersDto,
  CertifyProductDto,
  CreateProductWizardDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('wizard')
  @ApiOperation({ summary: 'Create product with coverages and tariffs' })
  wizard(
    @Body() dto: CreateProductWizardDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.wizard(dto, userId);
  }

  @Get(':id/full-config')
  @ApiOperation({ summary: 'Get full product configuration' })
  getFullConfig(@Param('id') id: string) {
    return this.service.getFullConfig(+id);
  }

  @Get(':id/emit-preview')
  @ApiOperation({ summary: 'Validate if product is emitible' })
  emitPreview(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.service.emitPreview(+id, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Put(':id/full-config')
  @ApiOperation({ summary: 'Update full product configuration' })
  updateFullConfig(
    @Param('id') id: string,
    @Body() dto: CreateProductWizardDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.updateFullConfig(+id, dto, userId);
  }

  @Post(':id/assign-producers')
  assignProducers(
    @Param('id') id: string,
    @Body() dto: AssignProducersDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.assignProducers(+id, dto, userId);
  }

  @Post(':id/certify')
  certify(
    @Param('id') id: string,
    @Body() dto: CertifyProductDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.certify(+id, dto, userId);
  }
}
