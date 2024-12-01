import { Controller, Post } from '@nestjs/common';

@Controller('wallet')
export class WalletController {
  @Post()
  create() {}
}
