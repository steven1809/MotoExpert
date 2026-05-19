import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GeneratePaymentDto } from './dto/generate-payment.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { PaymentService } from './payment.service';

@Injectable()
export class UsuarioRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = (req.user?.rol || req.user?.role || '').toLowerCase();
    if (role === 'cliente' || role === 'usuario') return true;
    throw new ForbiddenException('No autorizado');
  }
}

@Injectable()
export class EmpleadoRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = (req.user?.rol || req.user?.role || '').toLowerCase();
    if (role === 'empleado' || role === 'trabajador' || role === 'employee') {
      return true;
    }
    throw new ForbiddenException('No autorizado');
  }
}

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, UsuarioRoleGuard)
  async generate(@Body() dto: GeneratePaymentDto) {
    const payment = await this.paymentService.generateToken(
      dto.appointmentId,
      dto.method,
      dto.mockApproved,
    );

    return { payment, tokenCode: payment.tokenCode };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, EmpleadoRoleGuard)
  validate(@Body() dto: ValidateTokenDto) {
    return this.paymentService.validateToken(dto.tokenCode);
  }
}
