import { Module } from '@nestjs/common';
import { InternalTariffsController } from './internal-tariffs.controller';
import { InternalTariffsService } from './internal-tariffs.service';

@Module({
  controllers: [InternalTariffsController],
  providers: [InternalTariffsService],
})
export class InternalTariffsModule {}
