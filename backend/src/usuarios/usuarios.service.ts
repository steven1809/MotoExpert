import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  // 🔹 Obtener todos los usuarios
  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find();
  }

  // 🔹 Buscar usuario por email (para login)
  async findByEmail(email: string): Promise<Usuario | null> {
    return await this.usuariosRepository.findOne({ where: { email } });
  }

  // 🔹 Crear un nuevo usuario
  async create(usuarioData: Partial<Usuario>): Promise<Usuario> {
    const nuevoUsuario = this.usuariosRepository.create(usuarioData);
    return await this.usuariosRepository.save(nuevoUsuario);
  }
}
