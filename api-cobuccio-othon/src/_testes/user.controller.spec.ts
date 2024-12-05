import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/DTO/user.dto';
import { UserEntity } from '../db/entities/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _service: UserService;

  const mockUserService = {
    createUser: jest.fn(),
    findUserByCpf: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    _service = module.get<UserService>(UserService);
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

      const user = { ...createUserDto, id: '1' } as unknown as UserEntity;

      mockUserService.createUser.mockResolvedValue(user);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(user);
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const createUserDto: CreateUserDto = {
        cpf: '12345678900',
        email: 'test@example.com',
        name: 'Test User',
        telefone: '123456789',
        senha: 'password123',
        endereco: '',
      };

      mockUserService.createUser.mockRejectedValue(
        new Error('Erro ao criar usuário'),
      );

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        new HttpException(
          'Erro ao criar usuário',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('findByCpf', () => {
    it('deve retornar um usuário com sucesso', async () => {
      const cpf = '12345678900';
      const user = {
        cpf,
        name: 'Test User',
        email: 'test@example.com',
        telefone: '123456789',
      } as UserEntity;

      mockUserService.findUserByCpf.mockResolvedValue(user);

      const result = await controller.findByCpf(cpf);

      expect(result).toEqual(user);
      expect(mockUserService.findUserByCpf).toHaveBeenCalledWith(cpf);
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const cpf = '12345678900';

      mockUserService.findUserByCpf.mockRejectedValue(
        new Error('Erro ao buscar usuário'),
      );

      await expect(controller.findByCpf(cpf)).rejects.toThrow(
        new HttpException(
          'Erro ao buscar usuário',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
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

      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(cpf, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        cpf,
        updateUserDto,
      );
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const cpf = '12345678900';
      const updateUserDto = {
        email: 'updated@example.com',
      } as Partial<CreateUserDto>;

      mockUserService.updateUser.mockRejectedValue(
        new Error('Erro ao atualizar usuário'),
      );

      await expect(controller.updateUser(cpf, updateUserDto)).rejects.toThrow(
        new HttpException(
          'Erro ao atualizar usuário',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('deleteUser', () => {
    it('deve deletar um usuário com sucesso', async () => {
      const cpf = '12345678900';

      mockUserService.findUserByCpf.mockResolvedValue({ cpf });

      await controller.deleteUser(cpf);

      expect(mockUserService.findUserByCpf).toHaveBeenCalledWith(cpf);
    });

    it('deve lançar uma exceção em caso de erro', async () => {
      const cpf = '12345678900';

      mockUserService.findUserByCpf.mockRejectedValue(
        new Error('Erro ao deletar usuário'),
      );

      await expect(controller.deleteUser(cpf)).rejects.toThrow(
        new HttpException(
          'Erro ao deletar usuário',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
