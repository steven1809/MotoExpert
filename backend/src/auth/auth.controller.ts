import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';

// Decorador para rutas públicas
export const Public = () => SetMetadata('isPublic', true);

@Controller('auth') // La URL será: localhost:3001/auth
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Post('register') // La URL final: localhost:3001/auth/register
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('google')
  async googleLogin(@Body() body: { token: string }) {
    return this.authService.googleLogin(body.token);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-recovery-otp')
  verifyRecoveryOtp(@Body() body: { userId: number; code: string }) {
    return this.authService.verifyRecoveryOtp(body.userId, body.code);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { resetToken: string; newPassword: string }) {
    return this.authService.resetPassword(body.resetToken, body.newPassword);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
