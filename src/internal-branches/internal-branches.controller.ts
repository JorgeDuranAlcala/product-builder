import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import {
  CreateInternalBranchDto,
  InternalBranchSetupDto,
} from './dto/internal-branch.dto';
import { InternalBranchesService } from './internal-branches.service';

@ApiTags('internal-branches')
@Controller('internal-branches')
export class InternalBranchesController {
  constructor(private readonly service: InternalBranchesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateInternalBranchDto, @CurrentUserId() userId: string) {
    return this.service.create(dto, userId);
  }

  @Post(':id/setup')
  @ApiOperation({ summary: 'Setup counters and document masks' })
  setup(
    @Param('id') id: string,
    @Body() dto: InternalBranchSetupDto,
    @CurrentUserId() userId: string,
  ) {
    return this.service.setup(+id, dto, userId);
  }
}
