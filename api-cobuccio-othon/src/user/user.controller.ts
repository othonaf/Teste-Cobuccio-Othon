import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
  Delete,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './DTO/user.dto';
import { UserEntity } from 'src/db/entities/user.entity';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      this.logger.log(
        `Tentativa de criar usuário com CPF: ${createUserDto.cpf}`,
      );
      const user = await this.userService.createUser(createUserDto);
      this.logger.log(`Usuário criado com sucesso: ${user.cpf}`);
      return user;
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':cpf')
  async findByCpf(@Param('cpf') cpf: string): Promise<UserEntity> {
    try {
      this.logger.log(`Buscando usuário com CPF: ${cpf}`);
      return await this.userService.findUserByCpf(cpf);
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Endpoint de atualizar Usuário
  @Put(':cpf')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('cpf') cpf: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserEntity> {
    try {
      this.logger.log(`Atualizando usuário com CPF: ${cpf}`);

      return await this.userService.updateUser(cpf, updateUserDto);
    } catch (error) {
      this.logger.error(`Erro ao atualizar usuário: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Endpoint de Deletar um Usuário.
  @Delete(':cpf')
  async deleteUser(@Param('cpf') cpf: string): Promise<void> {
    try {
      this.logger.log(`Deletando usuário com CPF: ${cpf}`);
      await this.userService.findUserByCpf(cpf);
    } catch (error) {
      this.logger.error(`Erro ao deletar usuário: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
