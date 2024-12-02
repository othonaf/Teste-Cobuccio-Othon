import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletEntity } from 'src/db/entities/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionEntity } from '../db/entities/transaction.entity';
import { MockBacenService } from 'src/bacen/bacen.service';
import { v4 as uuidv4 } from 'uuid';

interface TransferMetadata {
  transactionId: string;
  timestamp: string;
  type: 'PIX' | 'TED' | 'DOC';
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
  ) {}

  async fundsTransfer(
    sourceWalletId: string,
    destinationWalletId: string,
    value: number,
    transferType: 'PIX' | 'TED' | 'DOC' = 'PIX',
  ): Promise<void> {
    const transactionId = uuidv4();

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

      // Validação das carteiras
      const sourceWallet =
        await this.walletService.findWalletById(sourceWalletId);
      const destinationWallet =
        await this.walletService.findWalletById(destinationWalletId);

      if (!sourceWallet || !destinationWallet) {
        throw new NotFoundException('Carteira não encontrada');
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
      await this.walletRepository.manager.transaction(
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

            this.logger.log(
              `Transferência ${transferType} concluída - ID: ${transactionId}`,
            );
          } catch (error) {
            // Reverte status da transação em caso de erro
            transaction.status = 'failed';
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
