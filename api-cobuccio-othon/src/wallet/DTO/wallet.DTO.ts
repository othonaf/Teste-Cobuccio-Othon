import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateWalletDto {
  @IsUUID()
  @IsOptional()
  wallet_id?: string;

  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  user_cpf: string;

  @IsNumber()
  @IsNotEmpty()
  balance: number;

  @IsString()
  @IsOptional()
  status?: string = 'active';

  @IsString()
  @IsOptional()
  currency?: string = 'BRL';

  @IsString()
  @IsNotEmpty()
  account_type: string;
}
