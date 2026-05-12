import { Injectable, UnauthorizedException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/usuario.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.ensureSuperAdmin();
  }

  private async ensureSuperAdmin() {
    const email = String(process.env.SUPERADMIN_EMAIL || 'admin@motoexpert.local')
      .toLowerCase()
      .trim();

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const passwordPlain = String(process.env.SUPERADMIN_PASSWORD || 'MotoExpert@123');
    const password = bcrypt.hashSync(passwordPlain, 10);

    const user = this.userRepository.create({
      email,
      password,
      nombre: String(process.env.SUPERADMIN_NOMBRE || 'Super'),
      apellidos: String(process.env.SUPERADMIN_APELLIDOS || 'Admin'),
      documento: String(process.env.SUPERADMIN_DOCUMENTO || 'SUPERADMIN'),
      telefono: String(process.env.SUPERADMIN_TELEFONO || '0000000000'),
      role: 'admin',
    });

    await this.userRepository.save(user);
    this.logger.log(`Super admin creado: ${email}`);
  }

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
    role: usuario.role
  };
  
  return {
    access_token: this.jwtService.sign(payload),
    role: usuario.role, 
    nombre: usuario.nombre,
    userId: usuario.id
  };
}

  async register(createUserDto: CreateUserDto) {
    const { password, email, ...userData } = createUserDto;

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);

      const user = this.userRepository.create({
        ...userData,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: createUserDto.role || 'user'
      });

      await this.userRepository.save(user);

      delete user.password;
      return user;

    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Ese correo ya está registrado');
      }
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async findAll() {
    const users = await this.userRepository.find();
    
    return users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    return this.userRepository.remove(user);
  }

  async forgotPassword(identifier: string) {
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier.toLowerCase().trim() },
        { telefono: identifier },
        { documento: identifier }
      ]
    });

    if (!user) throw new BadRequestException('Usuario no encontrado');

    // En un sistema real, aquí se generaría y enviaría un código OTP por email/SMS
    // Por ahora simularemos que se envió con éxito
    return { 
      message: 'Código de recuperación enviado con éxito',
      identifier // Devolvemos el identificador para usarlo en el siguiente paso
    };
  }

  async resetPassword(data: any) {
    const { identifier, otp, password, confirmPassword } = data;

    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Simulamos validación de OTP (en producción se validaría contra una tabla de tokens/OTPs)
    if (otp !== '123456') { // Código de prueba
      throw new BadRequestException('Código OTP inválido');
    }

    const user = await this.userRepository.findOne({
      where: [
        { email: identifier.toLowerCase().trim() },
        { telefono: identifier },
        { documento: identifier }
      ]
    });

    if (!user) throw new BadRequestException('Usuario no encontrado');

    user.password = bcrypt.hashSync(password, 10);
    await this.userRepository.save(user);

    return { message: 'Contraseña restablecida con éxito' };
  }
}
