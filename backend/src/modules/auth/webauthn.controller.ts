import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WebAuthnService } from './webauthn.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../../auth/auth.controller';

@Controller('auth/webauthn')
export class WebAuthnController {
  constructor(private readonly webauthnService: WebAuthnService) {}

  // REGISTRO (Requiere estar logueado para activar biométricos)
  @UseGuards(JwtAuthGuard)
  @Post('register-options')
  async registerOptions(@Request() req) {
    // req.user.userId viene del JwtAuthGuard
    return this.webauthnService.generateRegistrationOptions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register-verify')
  async registerVerify(@Request() req, @Body() body: any) {
    return this.webauthnService.verifyRegistration(req.user.userId, body);
  }

  // LOGIN (Público)
  @Public()
  @Post('login-options')
  async loginOptions(@Body() body: { email: string }) {
    return this.webauthnService.generateLoginOptions(body.email);
  }

  @Public()
  @Post('login-verify')
  async loginVerify(@Body() body: { email: string; response: any }) {
    return this.webauthnService.verifyLogin(body.email, body.response);
  }
}
