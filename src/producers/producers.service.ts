import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProducerDto } from './dto/create-producer.dto';

@Injectable()
export class ProducersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.producer.findMany({ orderBy: { code: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.producer.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateProducerDto, userId: string) {
    const producer = await this.prisma.producer.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        legacyCode: dto.legacyCode,
        status: dto.status,
        createdBy: userId,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'Producer',
      entityId: producer.id,
      summary: `Created producer ${producer.name}`,
      after: producer,
    });

    return producer;
  }
}
