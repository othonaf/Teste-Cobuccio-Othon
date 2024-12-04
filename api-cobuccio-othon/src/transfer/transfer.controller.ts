import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Get,
  Logger,
  Param,
} from '@nestjs/common';
import { TransferService } from './transfer.service';

@Controller('transfers')
export class TransferController {
  private readonly logger = new Logger(TransferController.name);
  constructor(private readonly transferService: TransferService) {}
  //Endpoint de Realizar uma Transação:
  @Post()
  async createTransfer(
    @Body()
    transferData: {
      sourceWalletId: string;
      destinationWalletId: string;
      value: number;
      transferType?: 'PIX' | 'TED' | 'DOC';
    },
  ) {
    try {
      this.logger.log(`Tentativa de Transação realizada: ${transferData}`);
      const transaction = await this.transferService.fundsTransfer(
        transferData.sourceWalletId,
        transferData.destinationWalletId,
        transferData.value,
        transferData.transferType,
      );

      return {
        status: 'success',
        message: 'Transferência realizada com sucesso',
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint de consultar uma Transação:
  @Get(':transaction_id')
  async findTransaction(
    @Param('transaction_id')
    transaction_id: string,
  ) {
    try {
      this.logger.log(`Buscando transação com ID: ${transaction_id}`);
      return await this.transferService.findTransaction(transaction_id);
    } catch (error) {
      // Lançar exceção com HttpException
      throw new HttpException(
        {
          status: 'error',
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Endpoint de Realizar uma Transação:
  @Post('reverse')
  async reverseTransfer(
    @Body()
    transaction_to_reverse: {
      transaction_id: string;
      value: number;
      reverseReason: string;
    },
  ) {
    try {
      this.logger.log(
        `Tentativa de Reversão de Transação realizada. ID: ${transaction_to_reverse}`,
      );
      const transaction = await this.transferService.reversalTransaction(
        transaction_to_reverse.transaction_id,
        transaction_to_reverse.value,
        transaction_to_reverse.reverseReason,
      );

      return {
        status: 'success',
        message: 'Estorno realizado com sucesso',
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
