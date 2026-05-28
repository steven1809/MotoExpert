import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebAuthnService } from './webauthn.service';
import { WebAuthnController } from './webauthn.controller';
import { WebAuthnCredential } from './entities/webauthn-credential.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebAuthnCredential, Usuario]),
    AuthModule, // Importamos el AuthModule existente para usar el AuthService (login)
  ],
  providers: [WebAuthnService],
  controllers: [WebAuthnController],
})
export class WebAuthnModule {}
