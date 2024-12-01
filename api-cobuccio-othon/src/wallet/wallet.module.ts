import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from 'src/db/entities/wallet.entity';

@Module({
  providers: [WalletService],
  controllers: [WalletController],
  imports: [TypeOrmModule.forFeature([WalletEntity])],
  exports: [WalletService],
})
export class WalletModule {}
