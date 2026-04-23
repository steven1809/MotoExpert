import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importa esto
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity'; // Importa tu entidad

@Module({
  imports: [
    // Esto es lo que le falta a tu código:
    TypeOrmModule.forFeature([User]) 
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}