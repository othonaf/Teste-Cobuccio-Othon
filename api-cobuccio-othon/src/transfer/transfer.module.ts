import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { TransactionEntity } from '../db/entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from 'src/wallet/wallet.module';
import { WalletEntity } from 'src/db/entities/wallet.entity';
import { BacenModule } from 'src/bacen/bacen.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, TransactionEntity]),
    WalletModule,
    BacenModule,
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
