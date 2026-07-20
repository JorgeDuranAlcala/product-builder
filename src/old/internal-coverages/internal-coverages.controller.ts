import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import {
  CreateInternalCoverageDto,
  InternalCoverageWithTariffDto,
} from './dto/internal-coverage.dto';
import { InternalCoveragesService } from './internal-coverages.service';

@ApiTags('internal-coverages')
@Controller('internal-coverages')
export class InternalCoveragesController {
  constructor(private readonly service: InternalCoveragesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(
    @Body() dto: CreateInternalCoverageDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Post('with-tariff')
  @ApiOperation({ summary: 'Create internal coverage with tariff (steps 3+4)' })
  createWithTariff(
    @Body() dto: InternalCoverageWithTariffDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.createWithTariff(dto, userId);
  }
}
