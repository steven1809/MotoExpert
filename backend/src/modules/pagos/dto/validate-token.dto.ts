import { IsString, Length, Matches } from 'class-validator';

export class ValidateTokenDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  tokenCode: string;
}
