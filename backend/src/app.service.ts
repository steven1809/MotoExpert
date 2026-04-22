import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenido a MotoExpert! El backend esta funcionando correctamente!';
  }
}
