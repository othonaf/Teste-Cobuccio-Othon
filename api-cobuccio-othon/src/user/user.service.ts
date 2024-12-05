import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../db/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './DTO/user.dto';
import * as bcrypt from 'bcrypt';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  private validateCpf(cpf: string): boolean {
    if (!cpf || cpf.length !== 11 || !cpf.match(/^\d+$/)) {
      return false;
    }
    if (new Set(cpf.split('')).size === 1) {
      return false;
    }
    return true;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async findUserByCpf(cpf: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { cpf },
      });

      if (!user) {
        this.logger.warn(`Usuário com CPF ${cpf} não encontrado`);
        throw new NotFoundException('Usuário não encontrado');
      }
      const wallet = await this.walletService.findWalletsByUser(cpf);
      const userFound = {
        name: user.name,
        email: user.email,
        telefone: user.telefone,
        wallets: wallet,
      };

      this.logger.debug(`Usuário encontrado: ${cpf}`);
      return userFound;
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário: ${error.message}`);
      throw error;
    }
  }

  async updateUser(
    cpf: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserEntity> {
    const user = await this.findUserByCpf(cpf);
    const updatedUser = this.userRepository.merge(user, updateUserDto);
    return await this.userRepository.save(updatedUser);
  }

  async createUser(createUser: CreateUserDto): Promise<UserEntity> {
    try {
      if (!this.validateCpf(createUser.cpf)) {
        throw new ConflictException('CPF inválido');
      }

      const existingUser = await this.userRepository.findOne({
        where: { cpf: createUser.cpf },
      });

      if (existingUser) {
        this.logger.warn(
          `Tentativa de criar usuário com CPF duplicado: ${createUser.cpf}`,
        );
        throw new ConflictException('Usuário já cadastrado');
      }

      const hashedPassword = await this.hashPassword(createUser.senha);

      const dbUser = this.userRepository.create({
        ...createUser,
        senha: hashedPassword,
      });

      const newUser = await this.userRepository.save(dbUser);
      this.logger.log(`Novo usuário criado com CPF: ${createUser.cpf}`);

      return newUser;
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      throw error;
    }
  }

  async authenticateUser(cpf: string, senha: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { cpf } });

      if (!user) {
        this.logger.warn(`Usuário com CPF ${cpf} não encontrado`);
        throw new NotFoundException('Usuário não encontrado');
      }

      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      if (!isPasswordValid) {
        this.logger.warn(`Senha inválida para o usuário com cpf ${cpf}`);
        return false;
      }

      this.logger.log(
        `Auteunticação bem-sucedida para o usuário com CPF ${cpf}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Erro ao autenticar o usuário: ${error.message}`);
      throw error;
    }
  }
}
