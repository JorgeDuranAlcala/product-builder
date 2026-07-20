import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IMMUTABLE_FORBIDDEN_MESSAGE,
  isProductImmutable,
} from '../utils/product-status.util';

@Injectable()
export class ProductMutableGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ params: { id?: string } }>();
    const productId = request.params?.id;

    if (!productId) {
      return true;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { isImmutable: true, status: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (isProductImmutable(product.isImmutable, product.status)) {
      throw new ForbiddenException({
        message: IMMUTABLE_FORBIDDEN_MESSAGE,
        statusCode: 403,
      });
    }

    return true;
  }
}

export function assertDeletable(status: ProductStatus): void {
  if (
    status === ProductStatus.SUBMITTED_TO_SUDEASEG ||
    status === ProductStatus.APPROVED_ACTIVE
  ) {
    throw new ForbiddenException(
      'No se puede eliminar un producto enviado a SUDEASEG o aprobado.',
    );
  }
}
