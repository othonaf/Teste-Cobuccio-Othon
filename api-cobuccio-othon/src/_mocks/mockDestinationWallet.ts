import { WalletEntity } from '../db/entities/wallet.entity';

export const mockDestinationWallet: WalletEntity = {
  wallet_id: 'wallet1',
  user_cpf: '12345678901',
  balance: 2000,
  date_created: new Date(),
  last_updated: new Date(),
  status: 'active',
  currency: 'BRL',
  account_type: 'savings',
  user: null,
};
