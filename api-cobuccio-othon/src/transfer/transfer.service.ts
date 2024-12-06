import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletEntity } from '../db/entities/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionEntity } from '../db/entities/transaction.entity';
import { MockBacenService } from '../bacen/bacen.service';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';

interface TransferMetadata {
  transactionId: string;
  timestamp: string;
  type: 'PIX' | 'TED' | 'DOC' | string;
  institution: {
    sourceBank: string;
    destinationBank: string;
  };
}

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    private readonly walletService: WalletService,
    private readonly mockBacenService: MockBacenService,
    private readonly userService: UserService,
  ) {}

  async fundsTransfer(
    cpf: string,
    senha: string,
    sourceWalletId: string,
    destinationWalletId: string,
    value: number,
    transferType: 'PIX' | 'TED' | 'DOC' = 'PIX',
  ): Promise<TransactionEntity> {
    const transactionId = uuidv4();

    const isAuthenticated = await this.userService.authenticateUser(cpf, senha);
    if (!isAuthenticated) {
      this.logger.warn(`Autenticação falhou para o usuário ${cpf}`);
      throw new ForbiddenException('Usuário ou senha incorretos.');
    }
    try {
      // Validação BACEN
      const bacenValidation = await this.mockBacenService.validateTransaction({
        originBank: 'BANCO_COBUCCIO_001',
        destinationBank: 'BANCO_COBUCCIO_001',
        amount: value,
        type: transferType,
      });

      if (bacenValidation.status !== 'SUCCESS') {
        throw new ForbiddenException(bacenValidation.message);
      }

      const userWallet = await this.userService.findUserByCpf(cpf);
      const sourceWallet = userWallet.wallets.find(
        wallet => wallet.wallet_id === sourceWalletId,
      );

      const destinationWallet =
        await this.walletService.findWalletById(destinationWalletId);

      if (!sourceWallet) {
        throw new Error(
          'A carteira de origem não pertence ao usuário autenticado.',
        );
      }

      if (!destinationWallet) {
        throw new NotFoundException('Carteira de destino não encontrada');
      }

      // Validações de negócio
      await this.validateTransfer(sourceWallet, destinationWallet, value);

      // Metadados da transação
      const metadata: TransferMetadata = {
        transactionId,
        timestamp: new Date().toISOString(),
        type: transferType,
        institution: {
          sourceBank: 'BANCO_COBUCCIO_001',
          destinationBank: 'BANCO_COBUCCIO_001',
        },
      };

      // Executa a transferência em uma única transação
      return await this.walletRepository.manager.transaction(
        async transactionManager => {
          // Notifica BACEN do início da transação
          await this.mockBacenService.notifyTransaction(transactionId);

          // Cria registro da transação
          const transaction = this.transactionRepository.create({
            transaction_id: transactionId,
            source_wallet_id: sourceWalletId,
            destination_wallet_id: destinationWalletId,
            amount: value,
            type: transferType,
            status: 'pending',
          });
          this.logger.log(
            `Primeiro registro criado valor do status: 'PENDING'`,
          );
          await transactionManager.save(transaction);
          await this.registerTransaction(metadata);

          try {
            // Debita da carteira de origem
            sourceWallet.balance -= value;
            sourceWallet.last_updated = new Date();
            await transactionManager.save(sourceWallet);

            // Simula latência de compensação
            if (transferType !== 'PIX') {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Credita na carteira de destino
            destinationWallet.balance += value;
            destinationWallet.last_updated = new Date();
            await transactionManager.save(destinationWallet);

            // Atualiza status da transação
            transaction.status = 'completed';
            await transactionManager.save(transaction);

            // Confirma a transação
            await this.confirmTransaction(metadata);
            await this.mockBacenService.confirmSettlement(transactionId);
            this.logger.log(`Status atualizado. Valor do status: 'COMPLETED'`);

            this.logger.log(
              `Transferência ${transferType} concluída - ID: ${transactionId}`,
            );
            return transaction;
          } catch (error) {
            // Reverte status da transação em caso de erro
            transaction.status = 'failed';
            this.logger.log(`Status atualizado. Valor do status: 'FAILED'`);
            transaction.reason_for_reversal = error.message;
            await transactionManager.save(transaction);
            throw error;
          }
        },
      );
    } catch (error) {
      await this.registerTransactionFailure(transactionId, error.message);
      this.logger.error(
        `Erro na transferência ${transactionId}: ${error.message}`,
      );
      throw error;
    }
  }

  async findTransaction(transaction_id: string): Promise<any> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { transaction_id },
      });
      if (!transaction) {
        throw new NotFoundException('ID de transação não encontrado.');
      }
      return transaction;
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      throw error;
    }
  }

  async reversalTransaction(
    transaction_id: string,
    value: number,
    reverseReason: string,
  ): Promise<TransactionEntity> {
    const transactionId = uuidv4();
    // Procura a transaction na Base de Dados
    const transactionFind = await this.transactionRepository.findOne({
      where: { transaction_id },
    });

    if (!transactionFind) {
      throw new NotFoundException('ID de transação não encontrado.');
    }

    if (value > transactionFind.amount) {
      throw new BadRequestException(
        'O valor do estorno informado é maior do que o valor original da transação.',
      );
    }

    let createdTransaction: TransactionEntity = null;

    // Executa a transferência em uma única transação
    await this.walletRepository.manager.transaction(
      async transactionManager => {
        // Notifica BACEN do início da transação
        await this.mockBacenService.notifyTransaction(transactionId);

        // Cria registro da transação
        const transaction = this.transactionRepository.create({
          transaction_id: transactionId,
          source_wallet_id: transactionFind.destination_wallet_id,
          destination_wallet_id: transactionFind.source_wallet_id,
          amount: value,
          type: 'reversal',
          status: 'pending',
          reason_for_reversal: reverseReason,
        });

        // Metadados da transação
        const metadata: TransferMetadata = {
          transactionId,
          timestamp: new Date().toISOString(),
          type: transactionFind.type,
          institution: {
            sourceBank: 'BANCO_COBUCCIO_001',
            destinationBank: 'BANCO_COBUCCIO_001',
          },
        };

        createdTransaction = await transactionManager.save(transaction);
        await this.registerTransaction(metadata);

        try {
          const sourceWallet = await this.walletService.findWalletById(
            transactionFind.destination_wallet_id,
          );
          const destinationWallet = await this.walletService.findWalletById(
            transactionFind.source_wallet_id,
          );

          // Debita da carteira de origem
          sourceWallet.balance -= value;
          sourceWallet.last_updated = new Date();
          await transactionManager.save(sourceWallet);

          // Simula latência de compensação
          if (transactionFind.type !== 'PIX') {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Credita na carteira de destino
          destinationWallet.balance += value;
          destinationWallet.last_updated = new Date();
          const creditedTransfer =
            await transactionManager.save(destinationWallet);

          // Atualiza status da transação
          if (creditedTransfer) {
            createdTransaction.status = 'completed';
            await transactionManager.save(createdTransaction);
          }

          // Confirma a transação
          await this.confirmTransaction(metadata);
          await this.mockBacenService.confirmSettlement(transactionId);

          await transactionManager.save(TransactionEntity, {
            transaction_id: transaction_id,
            reversed_at: new Date(),
            status: 'reversed',
          });

          this.logger.log(
            `Transferência ${transactionFind.type} concluída - ID: ${transactionId}`,
          );
        } catch (error) {
          // Reverte status da transação em caso de erro
          createdTransaction.status = 'failed';
          createdTransaction.reason_for_reversal = error.message;
          await transactionManager.save(createdTransaction);
          throw error;
        }
      },
    );

    return createdTransaction;
  }

  private async validateTransfer(
    sourceWallet: WalletEntity,
    destinationWallet: WalletEntity,
    value: number,
  ): Promise<void> {
    if (sourceWallet.status !== 'active') {
      throw new ForbiddenException('Carteira de origem está inativa');
    }

    if (destinationWallet.status !== 'active') {
      throw new ForbiddenException('Carteira de destino está inativa');
    }

    if (sourceWallet.balance < value) {
      throw new ForbiddenException('Saldo insuficiente');
    }
  }

  private async registerTransaction(metadata: TransferMetadata): Promise<void> {
    this.logger.log(`Registrando transação: ${metadata.transactionId}`);
  }

  private async confirmTransaction(metadata: TransferMetadata): Promise<void> {
    this.logger.log(`Confirmando transação: ${metadata.transactionId}`);
  }

  private async registerTransactionFailure(
    transactionId: string,
    error: string,
  ): Promise<void> {
    this.logger.error(
      `Registrando falha - ID: ${transactionId}, Erro: ${error}`,
    );
  }
}
