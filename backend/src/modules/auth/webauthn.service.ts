import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { WebAuthnCredential } from './entities/webauthn-credential.entity';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class WebAuthnService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(WebAuthnCredential)
    private readonly webAuthnRepo: Repository<WebAuthnCredential>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private get rpID() {
    return this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';
  }

  private get rpName() {
    return this.configService.get<string>('WEBAUTHN_RP_NAME') || 'MotoExpert';
  }

  private get origin() {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  // 1. Generar opciones de registro
  async generateRegistrationOptions(userId: number) {
    const user = await this.usuarioRepo.findOne({
      where: { id: userId },
      relations: ['webAuthnCredentials'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      // userID debe ser Uint8Array en la versión nueva
      userID: Buffer.from(user.id.toString()),
      // Fallback para userName
      userName: user.email ?? 'unknown',
      attestationType: 'none',
      excludeCredentials: user.webAuthnCredentials.map((cred) => ({
        id: cred.credentialID,
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Guardar el challenge temporalmente
    user.currentWebAuthnChallenge = options.challenge;
    await this.usuarioRepo.save(user);

    return options;
  }

  // 2. Verificar respuesta de registro
  async verifyRegistration(userId: number, body: any) {
    const user = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!user || !user.currentWebAuthnChallenge) {
      throw new BadRequestException('Challenge no encontrado o expirado');
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentWebAuthnChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    // En la versión nueva, los datos están dentro de registrationInfo.credential
    if (verification.verified && verification.registrationInfo?.credential) {
      const { publicKey, id, counter } = verification.registrationInfo.credential;

      const newCredential = this.webAuthnRepo.create({
        credentialID: Buffer.from(id).toString('base64url'),
        credentialPublicKey: Buffer.from(publicKey),
        counter,
        usuarioId: user.id,
        transports: body.response.transports,
      });

      await this.webAuthnRepo.save(newCredential);
      
      // Limpiar challenge (usar undefined en lugar de null)
      user.currentWebAuthnChallenge = undefined;
      await this.usuarioRepo.save(user);

      return { verified: true };
    }

    throw new BadRequestException('Fallo la verificación de WebAuthn');
  }

  // 3. Generar opciones de login
  async generateLoginOptions(email: string) {
    const user = await this.usuarioRepo.findOne({
      where: { email },
      relations: ['webAuthnCredentials'],
    });

    if (!user) throw new NotFoundException('Usuario no registrado');

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: user.webAuthnCredentials.map((cred) => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports as any,
      })),
      userVerification: 'preferred',
    });

    // Guardar el challenge
    user.currentWebAuthnChallenge = options.challenge;
    await this.usuarioRepo.save(user);

    return options;
  }

  // 4. Verificar respuesta de login y devolver JWT
  async verifyLogin(email: string, body: any) {
    const user = await this.usuarioRepo.findOne({
      where: { email },
      relations: ['webAuthnCredentials'],
    });

    if (!user || !user.currentWebAuthnChallenge) {
      throw new BadRequestException('Flujo de autenticación inválido');
    }

    const dbCredential = user.webAuthnCredentials.find(
      (c) => c.credentialID === body.id,
    );

    if (!dbCredential) {
      throw new BadRequestException('Credencial no encontrada en el servidor');
    }

    // El campo authenticator se reemplaza por credential en la versión nueva
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.currentWebAuthnChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        // Fix Error 1: Se espera un string (Base64URLString), no un Buffer
        id: dbCredential.credentialID,
        // Fix Error 2: Se espera Uint8Array<ArrayBuffer>. Buffer es Uint8Array<ArrayBufferLike>.
        // Convertimos el Buffer a un Uint8Array puro.
        publicKey: new Uint8Array(dbCredential.credentialPublicKey),
        counter: Number(dbCredential.counter),
        transports: dbCredential.transports as any,
      },
    });

    if (verification.verified) {
      // Actualizar contador
      dbCredential.counter = verification.authenticationInfo.newCounter;
      await this.webAuthnRepo.save(dbCredential);

      // Limpiar challenge (usar undefined en lugar de null)
      user.currentWebAuthnChallenge = undefined;
      await this.usuarioRepo.save(user);

      // Generar el mismo JWT que el login normal
      return this.authService.login(user);
    }

    throw new BadRequestException('Fallo la autenticación biométrica');
  }
}
