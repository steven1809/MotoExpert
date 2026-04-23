import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity'; 
import { CreateUserDto } from './dto/create-user.dto'; 

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, 
  ) {}

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