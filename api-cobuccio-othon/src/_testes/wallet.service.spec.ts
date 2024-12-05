import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../wallet/wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletEntity } from '../db/entities/wallet.entity';
import { UserEntity } from '../db/entities/user.entity';
import { UserService } from '../user/user.service';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('WalletService', () => {
  let service: WalletService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _walletRepository: Repository<WalletEntity>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _userRepository: Repository<UserEntity>;

  const mockWalletRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUserService = {
    validateCpf: jest.fn(),
    hashPassword: jest.fn(),
    findUserByCpf: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(WalletEntity),
          useValue: mockWalletRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    _walletRepository = module.get<Repository<WalletEntity>>(
      getRepositoryToken(WalletEntity),
    );
    _userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('deve criar uma nova wallet com sucesso', async () => {
      const user_cpf = '12345678900';
      const account_type = 'corrente';
      const initial_balance = 1000;

      const user = { cpf: user_cpf } as UserEntity;
      const wallet = {
        user_cpf,
        account_type,
        balance: initial_balance,
      } as WalletEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWalletRepository.create.mockReturnValue(wallet);
      mockWalletRepository.save.mockResolvedValue(wallet);

      const result = await service.createWallet(
        user_cpf,
        account_type,
        initial_balance,
      );

      expect(result).toEqual(wallet);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { cpf: user_cpf },
      });
      expect(mockWalletRepository.create).toHaveBeenCalledWith({
        user_cpf,
        account_type,
        balance: initial_balance,
      });
      expect(mockWalletRepository.save).toHaveBeenCalledWith(wallet);
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      const user_cpf = '12345678900';
      const account_type = 'corrente';
      const initial_balance = 1000;

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createWallet(user_cpf, account_type, initial_balance),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });
  });

  describe('findWalletsByUser', () => {
    it('deve retornar wallets do usuário com sucesso', async () => {
      const user_cpf = '12345678900';
      const wallets = [
        { user_cpf, account_type: 'corrente', balance: 1000 },
      ] as WalletEntity[];

      mockWalletRepository.find.mockResolvedValue(wallets);

      const result = await service.findWalletsByUser(user_cpf);

      expect(result).toEqual(wallets);
      expect(mockWalletRepository.find).toHaveBeenCalledWith({
        where: { user_cpf },
        relations: ['user'],
      });
    });

    it('deve lançar NotFoundException se nenhuma wallet for encontrada', async () => {
      const user_cpf = '12345678900';

      mockWalletRepository.find.mockResolvedValue([]);

      await expect(service.findWalletsByUser(user_cpf)).rejects.toThrow(
        new NotFoundException('Nenhuma wallet encontrada para este usuário'),
      );
    });
  });

  describe('findWalletById', () => {
    it('deve retornar a wallet com sucesso', async () => {
      const wallet_id = 'wallet1';
      const wallet = {
        wallet_id,
        user_cpf: '12345678900',
        account_type: 'corrente',
        balance: 1000,
      } as WalletEntity;

      mockWalletRepository.findOne.mockResolvedValue(wallet);

      const result = await service.findWalletById(wallet_id);

      expect(result).toEqual(wallet);
      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({
        where: { wallet_id },
        relations: ['user'],
      });
    });

    it('deve lançar NotFoundException se a wallet não for encontrada', async () => {
      const wallet_id = 'wallet1';

      mockWalletRepository.findOne.mockResolvedValue(null);

      await expect(service.findWalletById(wallet_id)).rejects.toThrow(
        new NotFoundException('Wallet não encontrada'),
      );
    });
  });
});
