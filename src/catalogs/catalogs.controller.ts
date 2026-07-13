import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('catalogs')
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('currencies')
  getCurrencies() {
    return this.prisma.currency.findMany();
  }

  @Get('reinsurance-contracts')
  getReinsuranceContracts() {
    return this.prisma.reinsuranceContract.findMany();
  }

  @Get('reinsurance-branches')
  getReinsuranceBranches() {
    return this.prisma.reinsuranceBranch.findMany();
  }
}
