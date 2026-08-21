import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  @IsIn([UserRole.USER, UserRole.ARTIST, UserRole.ORGANIZER])
  role?: UserRole;

  @IsString()
  @IsOptional()
  stage_name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  organization_name?: string;

  @IsString()
  @IsOptional()
  organization_description?: string;
}