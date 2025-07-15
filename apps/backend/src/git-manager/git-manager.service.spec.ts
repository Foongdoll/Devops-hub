import { Test, TestingModule } from '@nestjs/testing';
import { GitManagerService } from './git-manager.service';

describe('GitManagerService', () => {
  let service: GitManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitManagerService],
    }).compile();

    service = module.get<GitManagerService>(GitManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
