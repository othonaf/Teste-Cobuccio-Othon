import { Test, TestingModule } from '@nestjs/testing';
import { MockBacenService } from '../bacen/bacen.service';
import { BacenTransactionData } from '../bacen/interfaces/bacen-transaction.interface';
import { v4 as uuidv4 } from 'uuid';

describe('MockBacenService', () => {
  let service: MockBacenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockBacenService],
    }).compile();

    service = module.get<MockBacenService>(MockBacenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTransaction', () => {
    it('deve validar uma transação com sucesso', async () => {
      const data: BacenTransactionData = {
        originBank: 'BANCO_COBUCCIO_001',
        destinationBank: 'BANCO_COBUCCIO_001',
        amount: 1000,
        type: 'PIX',
      };

      const result = await service.validateTransaction(data);

      expect(result).toHaveProperty('status', 'SUCCESS');
      expect(result).toHaveProperty('code', 'BC-001');
      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty(
        'message',
        `Transação autorizada pelo BACEN para valor 1000 via PIX`,
      );
    });
  });

  describe('notifyTransaction', () => {
    it('deve notificar uma transação com sucesso', async () => {
      const transactionId = uuidv4();

      const result = await service.notifyTransaction(transactionId);

      expect(result).toHaveProperty('status', 'SUCCESS');
      expect(result).toHaveProperty('code', 'BC-002');
      expect(result).toHaveProperty('transactionId', transactionId);
      expect(result).toHaveProperty('message', 'Transação registrada no BACEN');
    });
  });

  describe('confirmSettlement', () => {
    it('deve confirmar a liquidação com sucesso', async () => {
      const transactionId = uuidv4();

      const result = await service.confirmSettlement(transactionId);

      expect(result).toHaveProperty('status', 'SUCCESS');
      expect(result).toHaveProperty('code', 'BC-003');
      expect(result).toHaveProperty('transactionId', transactionId);
      expect(result).toHaveProperty(
        'message',
        'Liquidação confirmada pelo BACEN',
      );
    });
  });
});
