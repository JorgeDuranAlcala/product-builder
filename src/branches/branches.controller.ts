import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto, CreateBranchWizardDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(+id);
  }

  @Post('wizard')
  @ApiOperation({ summary: 'Create branch with coverages and tariffs' })
  wizard(
    @Body() dto: CreateBranchWizardDto,
    @CurrentUserId() userId: string,
  ) {
    return this.branchesService.wizard(dto, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create master branch' })
  create(@Body() dto: CreateBranchDto, @CurrentUserId() userId: string) {
    return this.branchesService.create(dto, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUserId() userId: string,
  ) {
    return this.branchesService.update(+id, dto, userId);
  }
}
