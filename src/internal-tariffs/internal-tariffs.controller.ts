import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InternalTariffsService } from './internal-tariffs.service';

@ApiTags('internal-tariffs')
@Controller('internal-tariffs')
export class InternalTariffsController {
  constructor(private readonly service: InternalTariffsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}
