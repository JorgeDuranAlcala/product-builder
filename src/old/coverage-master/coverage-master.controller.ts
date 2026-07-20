import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CoverageMasterService } from './coverage-master.service';
import { CreateCoverageMasterDto } from './dto/create-coverage-master.dto';

@ApiTags('coverage-master')
@Controller('coverage-master')
export class CoverageMasterController {
  constructor(private readonly service: CoverageMasterService) {}

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
    @Body() dto: CreateCoverageMasterDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.create(dto, userId);
  }
}
