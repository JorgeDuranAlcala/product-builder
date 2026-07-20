import { Module } from '@nestjs/common';
import { ProductMutableGuard } from '../common/guards/product-mutable.guard';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductMutableGuard],
  exports: [ProductsService],
})
export class ProductsModule {}
