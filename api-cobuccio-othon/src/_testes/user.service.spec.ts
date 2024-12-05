import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../db/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from '../user/DTO/user.dto';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _userRepository: Repository<UserEntity>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _walletService: WalletService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
  };

  const mockWalletService = {
    findWalletsByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    _userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    _walletService = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve criar um novo usuário com sucesso', async () => {
      const createUserDto: CreateUserDto = {
        cpf: '12345678900',
        email: 'test@example.com',
        name: 'Test User',
        telefone: '123456789',
        senha: 'password123',
        endereco: '',
      };

      const hashedPassword = 'hashedPassword';
      const newUser = { ...createUserDto, senha: hashedPassword } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(null);
      jest.spyOn(service as any, 'validateCpf').mockReturnValue(true); // Access private method indirectly
      jest
        .spyOn(service as any, 'hashPassword')
        .mockResolvedValue(hashedPassword); // Access private method indirectly
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(newUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { cpf: createUserDto.cpf },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        senha: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('deve lançar ConflictException se o CPF for inválido', async () => {
      const createUserDto: CreateUserDto = {
        cpf: 'invalidCpf',
        email: 'test@example.com',
        name: 'Test User',
        telefone: '123456789',
        senha: 'password123',
        endereco: '',
      };

      jest.spyOn(service as any, 'validateCpf').mockReturnValue(false); // Access private method indirectly

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new ConflictException('CPF inválido'),
      );
    });

    it('deve lançar ConflictException se o usuário já existir', async () => {
      const createUserDto: CreateUserDto = {
        cpf: '12345678900',
        email: 'test@example.com',
        name: 'Test User',
        telefone: '123456789',
        senha: 'password123',
        endereco: '',
      };

      const existingUser = { cpf: createUserDto.cpf } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      jest.spyOn(service as any, 'validateCpf').mockReturnValue(true); // Access private method indirectly

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new ConflictException('Usuário já cadastrado'),
      );
    });
  });

  describe('findUserByCpf', () => {
    it('deve retornar um usuário com sucesso', async () => {
      const cpf = '12345678900';
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        telefone: '123456789',
      } as UserEntity;

      const wallets = [{ id: 'wallet1', user_cpf: cpf, balance: 1000 }];
      const userFound = { ...user, wallets };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWalletService.findWalletsByUser.mockResolvedValue(wallets);

      const result = await service.findUserByCpf(cpf);

      expect(result).toEqual(userFound);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { cpf },
      });
      expect(mockWalletService.findWalletsByUser).toHaveBeenCalledWith(cpf);
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      const cpf = '12345678900';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findUserByCpf(cpf)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('updateUser', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const cpf = '12345678900';
      const updateUserDto = {
        email: 'updated@example.com',
      } as Partial<CreateUserDto>;
      const user = {
        cpf,
        name: 'Test User',
        email: 'test@example.com',
        telefone: '123456789',
      } as UserEntity;

      const updatedUser = { ...user, ...updateUserDto };

      jest.spyOn(service, 'findUserByCpf').mockResolvedValue(user);
      mockUserRepository.merge.mockReturnValue(updatedUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser(cpf, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.findUserByCpf).toHaveBeenCalledWith(cpf);
      expect(mockUserRepository.merge).toHaveBeenCalledWith(
        user,
        updateUserDto,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('authenticateUser', () => {
    it('deve autenticar um usuário com sucesso', async () => {
      const cpf = '12345678900';
      const senha = 'password123';
      const hashedPassword = await bcrypt.hash(senha, 10);
      const user = { cpf, senha: hashedPassword } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.authenticateUser(cpf, senha);

      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { cpf },
      });
    });

    it('deve retornar false se a senha estiver incorreta', async () => {
      const cpf = '12345678900';
      const senha = 'password123';
      const hashedPassword = await bcrypt.hash('wrongpassword', 10);
      const user = { cpf, senha: hashedPassword } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.authenticateUser(cpf, senha);

      expect(result).toBe(false);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { cpf },
      });
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      const cpf = '12345678900';
      const senha = 'password123';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.authenticateUser(cpf, senha)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });
});
