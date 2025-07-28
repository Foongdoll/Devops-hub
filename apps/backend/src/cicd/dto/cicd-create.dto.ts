import { EnvVar } from '../entity/cicd-config.entity';
export class CreateCicdConfigDto {
  userCode: string;
  serverName: string;
  serverHost: string;
  sshUser: string;
  sshKey: string;
  repoUrl: string;
  branch: string;
  buildScript: string;
  deployScript: string;
  env?: EnvVar[];
  notifyEmail?: string;
}


import { PartialType } from '@nestjs/mapped-types';

export class UpdateCicdConfigDto extends PartialType(CreateCicdConfigDto) {}