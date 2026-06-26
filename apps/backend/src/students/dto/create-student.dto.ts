import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  firstNameKy?: string;

  @IsOptional()
  @IsString()
  lastNameKy?: string;

  @IsOptional()
  @IsString()
  firstNameRu?: string;

  @IsOptional()
  @IsString()
  lastNameRu?: string;

  @IsOptional()
  @IsString()
  firstNameUz?: string;

  @IsOptional()
  @IsString()
  lastNameUz?: string;

  @IsNotEmpty()
  dateOfBirth: string;

  @IsEnum(['male', 'female'])
  gender: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  classId: string;

  @IsNotEmpty()
  schoolId: string;
}