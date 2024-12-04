import { WalletEntity } from '../db/entities/wallet.entity';

export const mockSourceWallet: WalletEntity = {
  wallet_id: 'wallet2',
  user_cpf: '12345678901',
  balance: 1000,
  date_created: new Date(),
  status: 'active',
  last_updated: new Date(),
  currency: 'BRL',
  account_type: 'savings',
  user: null,
};
