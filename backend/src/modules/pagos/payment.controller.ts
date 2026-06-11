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
import { PaymentStatus } from './enums/payment-status.enum';

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

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req) {
    const userId = req.user.userId;
    const userRole = req.user.rol || req.user.role || '';
    return this.paymentService.findAll(userId, userRole);
  }

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

  // Endpoint para verificar pago de Wompi por ID de transacción de Wompi (público para redirect)
  @Post('verify-wompi-transaction/:transactionId')
  async verifyWompiPaymentByTransactionId(@Param('transactionId') transactionId: string) {
    const payment = await this.paymentService.verifyWompiPaymentByTransactionId(transactionId);
    return {
      payment,
      tokenCode: payment.tokenCode,
      status: payment.status === PaymentStatus.PAID ? 'APPROVED' : payment.status,
      appointmentId: payment.appointmentId,
    };
  }

  // GET endpoint for compatibility with PaymentConfirmation.js
  @Get('wompi/verify/:transactionId')
  async verifyWompiTransactionGet(@Param('transactionId') transactionId: string) {
    const payment = await this.paymentService.verifyWompiPaymentByTransactionId(transactionId);
    return {
      payment,
      tokenCode: payment.tokenCode,
      status: payment.status === PaymentStatus.PAID ? 'APPROVED' : payment.status,
      appointmentId: payment.appointmentId,
    };
  }

  @Post(':id/verify-wompi')
  @UseGuards(JwtAuthGuard, UsuarioRoleGuard)
  async verifyWompiPayment(@Param('id') id: string) {
    const payment = await this.paymentService.verifyWompiPayment(id);
    return {
      payment,
      tokenCode: payment.tokenCode,
      status: payment.status === PaymentStatus.PAID ? 'APPROVED' : payment.status,
    };
  }
}
