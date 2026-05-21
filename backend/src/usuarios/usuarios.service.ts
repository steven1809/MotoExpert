import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

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

  // 🔹 Buscar usuario por ID
  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return usuario;
  }

  // 🔹 Buscar usuario por email (para login)
  async findByEmail(email: string): Promise<Usuario | null> {
    const usuario = await this.usuariosRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    console.log('Usuario encontrado en DB:', usuario);
    return usuario;
  }

  // 🔹 Crear un nuevo usuario
  async create(usuarioData: Partial<Usuario>): Promise<Usuario> {
    const nuevoUsuario = this.usuariosRepository.create(usuarioData);
    return await this.usuariosRepository.save(nuevoUsuario);
  }
}