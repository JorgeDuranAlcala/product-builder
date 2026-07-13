import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InternalTariffsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.internalTariff.findMany({
      include: { internalCoverage: true, masterTariff: true },
    });
  }

  findOne(id: number) {
    return this.prisma.internalTariff.findUniqueOrThrow({
      where: { id },
      include: { internalCoverage: true, masterTariff: true },
    });
  }
}
