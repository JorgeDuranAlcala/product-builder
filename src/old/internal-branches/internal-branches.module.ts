import { Module } from '@nestjs/common';
import { InternalBranchesController } from './internal-branches.controller';
import { InternalBranchesService } from './internal-branches.service';

@Module({
  controllers: [InternalBranchesController],
  providers: [InternalBranchesService],
  exports: [InternalBranchesService],
})
export class InternalBranchesModule {}
