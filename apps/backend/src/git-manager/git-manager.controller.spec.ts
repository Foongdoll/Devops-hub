import { Test, TestingModule } from '@nestjs/testing';
import { GitManagerController } from './git-manager.controller';
import { GitManagerService } from './git-manager.service';

describe('GitManagerController', () => {
  let controller: GitManagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GitManagerController],
      providers: [GitManagerService],
    }).compile();

    controller = module.get<GitManagerController>(GitManagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
