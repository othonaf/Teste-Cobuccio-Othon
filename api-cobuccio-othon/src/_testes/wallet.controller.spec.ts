import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from '../wallet/wallet.controller';
import { WalletService } from '../wallet/wallet.service';

describe('WalletController', () => {
  let controller: WalletController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _service: WalletService;

  const mockWalletService = {
    createWallet: jest.fn(),
    findWalletsByUser: jest.fn(),
    findWalletById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    _service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('deve criar uma nova wallet com sucesso', async () => {
      const createWalletDto = {
        user_cpf: '12345678900',
        account_type: 'corrente',
        initial_balance: 1000,
      };
      const wallet = { id: 'wallet1', ...createWalletDto };

      mockWalletService.createWallet.mockResolvedValue(wallet);

      const result = await controller.createWallet(createWalletDto);

      expect(result).toEqual(wallet);
      expect(mockWalletService.createWallet).toHaveBeenCalledWith(
        createWalletDto.user_cpf,
        createWalletDto.account_type,
        createWalletDto.initial_balance,
      );
    });
  });

  describe('getWalletsByUser', () => {
    it('deve retornar wallets do usuário com sucesso', async () => {
      const cpf = '12345678900';
      const wallets = [{ id: 'wallet1', user_cpf: cpf, balance: 1000 }];

      mockWalletService.findWalletsByUser.mockResolvedValue(wallets);

      const result = await controller.getWalletsByUser(cpf);

      expect(result).toEqual(wallets);
      expect(mockWalletService.findWalletsByUser).toHaveBeenCalledWith(cpf);
    });
  });

  describe('getWalletById', () => {
    it('deve retornar a wallet com sucesso', async () => {
      const id = 'wallet1';
      const wallet = { id, user_cpf: '12345678900', balance: 1000 };

      mockWalletService.findWalletById.mockResolvedValue(wallet);

      const result = await controller.getWalletById(id);

      expect(result).toEqual(wallet);
      expect(mockWalletService.findWalletById).toHaveBeenCalledWith(id);
    });
  });
});
