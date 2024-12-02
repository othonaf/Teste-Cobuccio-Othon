import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TransferService } from './transfer.service';

@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

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
      await this.transferService.fundsTransfer(
        transferData.sourceWalletId,
        transferData.destinationWalletId,
        transferData.value,
        transferData.transferType,
      );

      return {
        status: 'success',
        message: 'Transferência realizada com sucesso',
        data: {
          sourceWalletId: transferData.sourceWalletId,
          destinationWalletId: transferData.destinationWalletId,
          value: transferData.value,
          transferType: transferData.transferType || 'PIX',
        },
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
