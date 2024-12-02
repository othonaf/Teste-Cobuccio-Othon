import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletEntity } from 'src/db/entities/wallet.entity';
import { UserService } from '../user/user.service';
import { UserEntity } from 'src/db/entities/user.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async createWallet(
    user_cpf: string,
    account_type: string,
    initial_balance: number = 0,
  ): Promise<WalletEntity> {
    try {
      // Verifica se o usuário existe
      const cpf = user_cpf;
      const user = await this.userRepository.findOne({
        where: { cpf },
      });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Cria a nova wallet
      const wallet = this.walletRepository.create({
        user_cpf,
        account_type,
        balance: initial_balance,
      });

      this.logger.log(`Criando wallet para usuário ${user_cpf}`);
      return await this.walletRepository.save(wallet);
    } catch (error) {
      this.logger.error(`Erro ao criar wallet: ${error.message}`);
      throw error;
    }
  }

  async findWalletsByUser(user_cpf: string): Promise<WalletEntity[]> {
    try {
      const wallets = await this.walletRepository.find({
        where: { user_cpf },
        relations: ['user'],
      });

      if (!wallets.length) {
        throw new NotFoundException(
          'Nenhuma wallet encontrada para este usuário',
        );
      }

      return wallets;
    } catch (error) {
      this.logger.error(`Erro ao buscar wallets: ${error.message}`);
      throw error;
    }
  }

  async findWalletById(wallet_id: string): Promise<WalletEntity> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { wallet_id },
        relations: ['user'],
      });

      if (!wallet) {
        throw new NotFoundException('Wallet não encontrada');
      }

      return wallet;
    } catch (error) {
      this.logger.error(`Erro ao buscar wallet: ${error.message}`);
      throw error;
    }
  }
}
