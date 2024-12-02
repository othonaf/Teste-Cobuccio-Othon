import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletEntity } from 'src/db/entities/wallet.entity';
import { UserModule } from '../user/user.module';
import { forwardRef } from '@nestjs/common';
import { UserEntity } from 'src/db/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, UserEntity]),
    forwardRef(() => UserModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}
