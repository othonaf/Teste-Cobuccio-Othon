import { Test, TestingModule } from '@nestjs/testing';
import { TransferController } from '../transfer/transfer.controller';
import { TransferService } from '../transfer/transfer.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TransferController', () => {
  let controller: TransferController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: TransferService;

  const mockTransferService = {
    fundsTransfer: jest.fn(),
    findTransaction: jest.fn(),
    reversalTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TransferService,
          useValue: mockTransferService,
        },
      ],
    }).compile();

    controller = module.get<TransferController>(TransferController);
    service = module.get<TransferService>(TransferService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransfer', () => {
    it('deve criar uma transferência com sucesso', async () => {
      const transferData = {
        cpf: '1513556',
        senha: 'fdsf156',
        sourceWalletId: 'wallet1',
        destinationWalletId: 'wallet2',
        value: 1000,
        transferType: 'PIX' as const,
      };
      const transaction = { id: 'transaction1', status: 'completed' };

      mockTransferService.fundsTransfer.mockResolvedValue(transaction);

      const result = await controller.createTransfer(transferData);

      expect(result).toEqual({
        status: 'success',
        message: 'Transferência realizada com sucesso',
        data: transaction,
      });
      expect(mockTransferService.fundsTransfer).toHaveBeenCalledWith(
        transferData.cpf,
        transferData.senha,
        transferData.sourceWalletId,
        transferData.destinationWalletId,
        transferData.value,
        transferData.transferType,
      );
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const transferData = {
        cpf: '1513556',
        senha: 'fdsf156',
        sourceWalletId: 'wallet1',
        destinationWalletId: 'wallet2',
        value: 1000,
        transferType: 'PIX' as const,
      };
      mockTransferService.fundsTransfer.mockRejectedValue(
        new Error('Erro ao criar transferência'),
      );

      await expect(controller.createTransfer(transferData)).rejects.toThrow(
        new HttpException(
          {
            status: 'error',
            message: 'Erro ao criar transferência',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('findTransaction', () => {
    it('deve retornar uma transação', async () => {
      const transactionId = 'transaction1';
      const transaction = { id: transactionId, status: 'completed' };

      mockTransferService.findTransaction.mockResolvedValue(transaction);

      const result = await controller.findTransaction(transactionId);

      expect(result).toEqual(transaction);
      expect(mockTransferService.findTransaction).toHaveBeenCalledWith(
        transactionId,
      );
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const transactionId = 'transaction1';
      mockTransferService.findTransaction.mockRejectedValue(
        new Error('Transação não encontrada'),
      );

      await expect(controller.findTransaction(transactionId)).rejects.toThrow(
        new HttpException(
          {
            status: 'error',
            message: 'Transação não encontrada',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('reverseTransfer', () => {
    it('deve reverter uma transferência com sucesso', async () => {
      const transaction_to_reverse = {
        transaction_id: 'transaction1',
        value: 1000,
        reverseReason: 'Motivo da reversão',
      };
      const transaction = { id: 'transaction2', status: 'reversed' };

      mockTransferService.reversalTransaction.mockResolvedValue(transaction);

      const result = await controller.reverseTransfer(transaction_to_reverse);

      expect(result).toEqual({
        status: 'success',
        message: 'Estorno realizado com sucesso',
        data: transaction,
      });
      expect(mockTransferService.reversalTransaction).toHaveBeenCalledWith(
        transaction_to_reverse.transaction_id,
        transaction_to_reverse.value,
        transaction_to_reverse.reverseReason,
      );
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const transaction_to_reverse = {
        transaction_id: 'transaction1',
        value: 1000,
        reverseReason: 'Motivo da reversão',
      };
      mockTransferService.reversalTransaction.mockRejectedValue(
        new Error('Erro ao reverter transferência'),
      );

      await expect(
        controller.reverseTransfer(transaction_to_reverse),
      ).rejects.toThrow(
        new HttpException(
          {
            status: 'error',
            message: 'Erro ao reverter transferência',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
