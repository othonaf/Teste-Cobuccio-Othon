import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from '../transfer/transfer.service';
import { WalletService } from '../wallet/wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletEntity } from '../db/entities/wallet.entity';
import { TransactionEntity } from '../db/entities/transaction.entity';
import { MockBacenService } from '../bacen/bacen.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { mockSourceWallet } from '../_mocks/mockWallet';
import { mockDestinationWallet } from '../_mocks/mockDestinationWallet';

describe('TransferService', () => {
  let service: TransferService;
  let walletService: WalletService;
  let mockBacenService: jest.Mocked<MockBacenService>;
  let mockTransactionRepository: jest.Mocked<Repository<TransactionEntity>>;
  let mockWalletRepository: jest.Mocked<Repository<WalletEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WalletEntity),
          useValue: {
            save: jest.fn(),
            manager: {
              transaction: jest.fn(cb =>
                cb({
                  save: jest.fn(),
                }),
              ),
            },
          },
        },
        {
          provide: WalletService,
          useValue: {
            findWalletById: jest.fn(),
          },
        },
        {
          provide: MockBacenService,
          useValue: {
            validateTransaction: jest.fn(),
            notifyTransaction: jest.fn(),
            confirmSettlement: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    walletService = module.get<WalletService>(WalletService);
    mockBacenService = module.get(MockBacenService);
    mockTransactionRepository = module.get(
      getRepositoryToken(TransactionEntity),
    );
    mockTransactionRepository.create.mockReturnValue({
      status: 'pending',
      transaction_id: '',
      source_wallet_id: '',
      destination_wallet_id: '',
      amount: 0,
      type: '',
      created_at: undefined,
      reversed_at: undefined,
      reason_for_reversal: '',
    });
    mockWalletRepository = module.get(getRepositoryToken(WalletEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fundsTransfer', () => {
    it('Deve fazer a transferência com sucesso', async () => {
      const sourceWallet = {
        wallet_id: '7b4e2df0-c55c-4e92-9d70-dd880c8e2057',
        balance: 1000,
        status: 'active',
      } as WalletEntity;
      const destinationWallet = {
        wallet_id: '03037ebb-e73d-48db-8f06-d3b398d87ec2',
        balance: 0,
        status: 'active',
      } as WalletEntity;

      jest
        .spyOn(walletService, 'findWalletById')
        .mockResolvedValueOnce(sourceWallet)
        .mockResolvedValueOnce(destinationWallet);

      mockBacenService.validateTransaction.mockResolvedValue({
        status: 'SUCCESS',
        code: 'BC-001',
        timestamp: new Date().toISOString(),
        transactionId: 'mock-transaction-id',
        message: 'Transação autorizada pelo BACEN',
      });

      await service.fundsTransfer('123', '456', 500, 'PIX');

      expect(mockBacenService.validateTransaction).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          amount: 500,
        }),
      );
      expect(mockWalletRepository.manager.transaction).toHaveBeenCalled();
    });

    it('Deve lançar erro se o saldo for insuficiente', async () => {
      const sourceWallet: WalletEntity = {
        wallet_id: 'wallet2',
        user_cpf: '12345678901',
        balance: 0,
        date_created: new Date(),
        status: 'active',
        last_updated: new Date(),
        currency: 'BRL',
        account_type: 'savings',
        user: null,
      };
      const destinationWallet: WalletEntity = {
        wallet_id: 'wallet2',
        user_cpf: '12345678901',
        balance: 1000,
        date_created: new Date(),
        status: 'active',
        last_updated: new Date(),
        currency: 'BRL',
        account_type: 'savings',
        user: null,
      };

      jest
        .spyOn(walletService, 'findWalletById')
        .mockResolvedValueOnce(sourceWallet)
        .mockResolvedValueOnce(destinationWallet);

      mockBacenService.validateTransaction.mockResolvedValue({
        status: 'SUCCESS',
        code: 'BC-001',
        timestamp: new Date().toISOString(),
        transactionId: 'mock-transaction-id',
        message: 'Transação autorizada pelo BACEN',
      });

      await expect(
        service.fundsTransfer('123', '456', 500, 'PIX'),
      ).rejects.toThrow('Saldo insuficiente');
    });

    it('Deve lançar erro se a validação do BACEN falhar', async () => {
      mockBacenService.validateTransaction.mockResolvedValue({
        status: 'ERROR',
        code: 'BC-002',
        timestamp: new Date().toISOString(),
        transactionId: 'mock-transaction-id',
        message: 'Erro BACEN',
      });

      await expect(
        service.fundsTransfer('123', '456', 500, 'PIX'),
      ).rejects.toThrow('Erro BACEN');
    });
  });

  describe('reversalTransaction', () => {
    it('Deve reverter uma transação com sucesso', async () => {
      jest
        .spyOn(walletService, 'findWalletById')
        .mockResolvedValueOnce(mockSourceWallet)
        .mockResolvedValueOnce(mockDestinationWallet);

      mockTransactionRepository.findOne.mockResolvedValue({
        transaction_id: '123',
        source_wallet_id: 'wallet1',
        destination_wallet_id: 'wallet2',
        amount: 1000,
        type: 'PIX',
        status: 'completed',
      } as TransactionEntity);

      mockTransactionRepository.create.mockReturnValue({
        transaction_id: 'd8225882',
        source_wallet_id: 'wallet2',
        destination_wallet_id: 'wallet1',
        amount: 1000,
        type: 'reversal',
        status: 'pending',
      } as TransactionEntity);

      jest
        .spyOn(mockWalletRepository.manager, 'transaction')
        .mockImplementation(
          async (
            isolationLevel: any,
            runInTransaction: (transactionManager: any) => Promise<any>,
          ) => {
            if (typeof isolationLevel === 'function') {
              runInTransaction = isolationLevel;
            }
            const mockTransactionManager = {
              save: jest.fn().mockImplementation(async entity => entity),
            };
            return runInTransaction(mockTransactionManager);
          },
        );

      const result = await service.reversalTransaction(
        '123',
        1000,
        'Reversal test',
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(mockTransactionRepository.findOne).toHaveBeenCalled();
      expect(mockTransactionRepository.create).toHaveBeenCalled();
      expect(mockWalletRepository.manager.transaction).toHaveBeenCalled();
    });

    it('Deve lançar NotFoundException quando a transação não for encontrada', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reversalTransaction('invalid-id', 500, 'Reversal test'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Deve lançar BadRequestException quando o valor solicitado do estorno for maior que o original', async () => {
      mockTransactionRepository.findOne.mockResolvedValue({
        transaction_id: '123',
        source_wallet_id: 'wallet1',
        destination_wallet_id: 'wallet2',
        amount: 1000,
        type: 'PIX',
        status: 'completed',
      } as TransactionEntity);

      await expect(
        service.reversalTransaction('123', 1500, 'Reversal test'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
