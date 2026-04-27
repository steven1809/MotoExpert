import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) throw new UnauthorizedException('Contraseña incorrecta');

    return usuario;
  }

  async login(usuario: any) {
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const { password, email, ...userData } = createUserDto;

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);

      const user = this.userRepository.create({
        ...userData,
        email: email.toLowerCase().trim(),
        password: hashedPassword
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
}
