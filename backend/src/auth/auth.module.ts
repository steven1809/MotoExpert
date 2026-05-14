import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';
import { UsuariosModule } from '../modules/usuarios/usuarios.module';
import { OtpModule } from '../modules/otp/otp.module';
import { MailModule } from '../modules/mail/mail.module';

@Module({
  imports: [
    UsuariosModule,
    OtpModule,
    MailModule,
    PassportModule,
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.register({
      secret: 'clave_secreta', 
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
