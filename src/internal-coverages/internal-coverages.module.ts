import { Module } from '@nestjs/common';
import { InternalCoveragesController } from './internal-coverages.controller';
import { InternalCoveragesService } from './internal-coverages.service';

@Module({
  controllers: [InternalCoveragesController],
  providers: [InternalCoveragesService],
  exports: [InternalCoveragesService],
})
export class InternalCoveragesModule {}
