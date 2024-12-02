import { Test, TestingModule } from '@nestjs/testing';
import { BacenController } from './bacen.controller';

describe('BacenController', () => {
  let controller: BacenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BacenController],
    }).compile();

    controller = module.get<BacenController>(BacenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
