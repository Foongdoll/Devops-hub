import { Test, TestingModule } from '@nestjs/testing';
import { CicdController } from './cicd.controller';
import { CicdService } from './cicd.service';

describe('CicdController', () => {
  let controller: CicdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CicdController],
      providers: [CicdService],
    }).compile();

    controller = module.get<CicdController>(CicdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
