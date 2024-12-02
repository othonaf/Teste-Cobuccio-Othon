import { Injectable, Logger } from '@nestjs/common';
import { BacenTransactionData } from './interfaces/bacen-transaction.interface';
import { BacenApiResponse } from './interfaces/bacen-api.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockBacenService {
  private readonly logger = new Logger(MockBacenService.name);

  async validateTransaction(
    data: BacenTransactionData,
  ): Promise<BacenApiResponse> {
    // Simula latência da API do BACEN
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      status: 'SUCCESS',
      code: 'BC-001',
      timestamp: new Date().toISOString(),
      transactionId: uuidv4(),
      message: `Transação autorizada pelo BACEN para valor ${data.amount} via ${data.type}`,
    };
  }

  async notifyTransaction(transactionId: string): Promise<BacenApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      status: 'SUCCESS',
      code: 'BC-002',
      timestamp: new Date().toISOString(),
      transactionId,
      message: 'Transação registrada no BACEN',
    };
  }

  async confirmSettlement(transactionId: string): Promise<BacenApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      status: 'SUCCESS',
      code: 'BC-003',
      timestamp: new Date().toISOString(),
      transactionId,
      message: 'Liquidação confirmada pelo BACEN',
    };
  }
}
