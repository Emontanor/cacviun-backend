import { VerificationDto } from './verification.dto';

export interface VerificationCodeDto extends VerificationDto {
  code: string;
}