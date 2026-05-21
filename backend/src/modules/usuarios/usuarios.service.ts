import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find();
  }
  async findByEmail(email: string) {
    return this.usuariosRepository.findOne({
      where: { email },
    });
  }

  async findOne(id: number): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { id } });
  }

  async update(id: number, updateData: any) {
    const user = await this.usuariosRepository.findOne({ where: { id } });
    if (!user) throw new Error('Usuario no encontrado');

    // No permitir cambiar el password por aquí por seguridad
    const { password, ...rest } = updateData;

    Object.assign(user, rest);
    const updatedUser = await this.usuariosRepository.save(user);

    const { password: _p, ...result } = updatedUser;
    return result;
  }
}
