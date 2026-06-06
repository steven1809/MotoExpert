import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Param,
  Post,
  Request,
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
    if (role === 'cliente' || role === 'usuario' || role === 'user') return true;
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

    return { 
      payment, 
      tokenCode: payment.tokenCode,
      wompiPaymentLink: payment.wompiPaymentLink,
    };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, EmpleadoRoleGuard)
  validate(@Body() dto: ValidateTokenDto) {
    return this.paymentService.validateToken(dto.tokenCode);
  }

  @Get('appointment/:appointmentId')
  @UseGuards(JwtAuthGuard, UsuarioRoleGuard)
  getByAppointment(@Param('appointmentId') appointmentId: string, @Request() req) {
    return this.paymentService.getTokenInfoForUser(
      req.user.userId,
      Number(appointmentId),
    );
  }

  // Nuevo endpoint para verificar pago de Wompi
  @Post(':id/verify-wompi')
  @UseGuards(JwtAuthGuard, UsuarioRoleGuard)
  async verifyWompiPayment(@Param('id') id: string) {
    const payment = await this.paymentService.verifyWompiPayment(id);
    return { 
      payment, 
      tokenCode: payment.tokenCode,
      status: payment.status,
    };
  }
}
