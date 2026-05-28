import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UsuariosService } from '../modules/usuarios/usuarios.service';
import { OtpService } from '../modules/otp/otp.service';
import { MailService } from '../modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    const valido = await bcrypt.compare(password, usuario.password || '');
    if (!valido) throw new UnauthorizedException('Contraseña incorrecta');

    return usuario;
  }

  async login(usuario: Usuario) {
    const payload = {
      email: usuario.email,
      sub: usuario.id,
      role: usuario.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      role: usuario.role,
      nombre: usuario.nombre,
      userId: usuario.id,
      picture: usuario.picture,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const { password, email, ...userData } = createUserDto;

    try {
      if (!password)
        throw new BadRequestException('La contraseña es requerida');
      const hashedPassword = bcrypt.hashSync(password, 10);

      const user = this.userRepository.create({
        ...userData,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: createUserDto.role || 'user',
      });

      await this.userRepository.save(user);

      const { password: _pw, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error.code === '23505') {
        if (error.detail && error.detail.includes('email')) {
          throw new BadRequestException('Ese correo ya está registrado');
        }
        if (error.detail && error.detail.includes('documento')) {
          throw new BadRequestException('Ese número de documento ya está registrado');
        }
        throw new BadRequestException('Ya existe un registro con esos datos (correo o documento)');
      }
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async findAll() {
    const users = await this.userRepository.find();

    return users.map((user) => {
      const { password, ...rest } = user;
      return rest;
    });
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    return this.userRepository.remove(user);
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('El correo es requerido');
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (user) {
      const code = await this.otpService.generateOtp(user.id, 'password-reset');
      try {
        if (!user.email || !user.nombre)
          throw new BadRequestException('Usuario inválido');
        await this.mailService.sendPasswordRecoveryEmail(
          user.email,
          user.nombre,
          code,
        );
      } catch (mailError) {
        console.error('Error sending recovery email:', mailError);
      }
      return {
        message: 'Si el correo existe, recibirás un código',
        userId: user.id,
      };
    }

    return {
      message: 'Si el correo existe, recibirás un código',
      userId: null,
    };
  }

  async verifyRecoveryOtp(userId: number, code: string) {
    const isValid = await this.otpService.validateOtp(
      userId,
      code,
      'password-reset',
    );
    if (!isValid) {
      throw new UnauthorizedException('Código inválido o expirado');
    }

    const resetToken = this.jwtService.sign(
      { sub: userId, purpose: 'password-reset' },
      { expiresIn: '15m' },
    );

    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(resetToken);
      if (payload.purpose !== 'password-reset') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) throw new BadRequestException('Usuario no encontrado');

      user.password = bcrypt.hashSync(newPassword, 10);
      await this.userRepository.save(user);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async googleLogin(googleToken: string) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${googleToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Token de Google inválido');
      }

      const googleUser = await response.json();
      const {
        sub: googleId,
        email,
        given_name: nombre,
        family_name: apellidos,
        picture,
      } = googleUser;

      let usuario = await this.userRepository.findOne({
        where: [{ googleId }, { email }],
      });

      if (usuario) {
        if (!usuario.googleId) {
          usuario.googleId = googleId;
          usuario.picture = picture;
          usuario.provider = 'google';
          await this.userRepository.save(usuario);
        }
      } else {
        usuario = this.userRepository.create({
          googleId,
          email,
          nombre,
          apellidos,
          picture,
          provider: 'google',
          role: 'cliente',
        });
        await this.userRepository.save(usuario);
      }

      const payload = {
        email: usuario.email,
        sub: usuario.id,
        role: usuario.role,
      };

      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          email: usuario.email,
          picture: usuario.picture,
          role: usuario.role,
        },
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw new UnauthorizedException('Error al autenticar con Google');
    }
  }
}
