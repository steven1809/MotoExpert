import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { EmpleadosModule } from './modules/empleados/empleados.module';
import { CitasModule } from './modules/citas/citas.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Esto carga el archivo .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Esto conecta Nest con MotoExpert en pgAdmin
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService], 
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD') || '12345',
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    UsuariosModule,
    AuthModule,
    VehiculosModule,
    ServiciosModule,
    EmpleadosModule,
    CitasModule,
    PagosModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}