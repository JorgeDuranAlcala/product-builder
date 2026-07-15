import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.PRODUCT_MANAGER)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with filters' })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll({
      userId: query.userId,
      productId: query.productId,
      entityType: query.entityType,
      action: query.action,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Audit history for a product' })
  findByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByProduct(+productId, page, limit);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Audit history for a user' })
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByUser(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log detail' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
