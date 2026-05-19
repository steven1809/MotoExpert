import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async generateOtp(
    userId: number,
    purpose: string = 'password-reset',
  ): Promise<string> {
    await this.otpRepository.update(
      { userId, purpose, used: false },
      { used: true },
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      userId,
      code,
      purpose,
      expiresAt,
      used: false,
    });
    await this.otpRepository.save(otp);

    return code;
  }

  async validateOtp(
    userId: number,
    code: string,
    purpose: string = 'password-reset',
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { userId, code, purpose, used: false },
    });

    if (!otp) return false;
    if (new Date() > otp.expiresAt) return false;

    otp.used = true;
    await this.otpRepository.save(otp);
    return true;
  }
}
