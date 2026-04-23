import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth') // La URL será: localhost:3000/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get() 
  findAll() {
    return this.authService.findAll();
  }

  @Post('register') // La URL final: localhost:3000/auth/register
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
}