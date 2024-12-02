import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallets')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  async createWallet(
    @Body()
    createWalletDto: {
      user_cpf: string;
      account_type: string;
      initial_balance?: number;
    },
  ) {
    return await this.walletService.createWallet(
      createWalletDto.user_cpf,
      createWalletDto.account_type,
      createWalletDto.initial_balance,
    );
  }

  @Get('user/:cpf')
  async getWalletsByUser(@Param('cpf') cpf: string) {
    return await this.walletService.findWalletsByUser(cpf);
  }

  @Get(':id')
  async getWalletById(@Param('id') id: string) {
    return await this.walletService.findWalletById(id);
  }
}
