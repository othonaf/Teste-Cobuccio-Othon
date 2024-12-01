import { IsString, IsNotEmpty, IsEmail, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  endereco: string;

  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  telefone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 150)
  senha: string;
}
