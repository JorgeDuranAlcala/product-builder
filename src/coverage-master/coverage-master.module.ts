import { Module } from '@nestjs/common';
import { CoverageMasterController } from './coverage-master.controller';
import { CoverageMasterService } from './coverage-master.service';

@Module({
  controllers: [CoverageMasterController],
  providers: [CoverageMasterService],
  exports: [CoverageMasterService],
})
export class CoverageMasterModule {}
