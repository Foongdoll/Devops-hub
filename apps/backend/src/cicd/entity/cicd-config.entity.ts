// src/cicd/entities/cicd-config.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface EnvVar {
  key: string;
  value: string;
}

@Entity({ name: 'cicd_config' })
export class CicdConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 회원 식별 코드 */
  @Column({ name: 'user_code' })
  userCode: string;

  /** 배포할 서버 이름 */
  @Column({ name: 'server_name' })
  serverName: string;

  /** 서버 주소 또는 IP */
  @Column({ name: 'server_host' })
  serverHost: string;

  /** SSH 접속 유저 */
  @Column({ name: 'ssh_user' })
  sshUser: string;

  /** SSH Private Key (파일 업로드한 내용) */
  @Column('text', { name: 'ssh_key' })
  sshKey: string;

  /** Git 저장소 URL */
  @Column({ name: 'repo_url' })
  repoUrl: string;

  /** 선택된 브랜치 */
  @Column({ name: 'branch' })
  branch: string;

  /** 빌드 스크립트 명령어 */
  @Column('text', { name: 'build_script' })
  buildScript: string;

  /** 배포 스크립트 명령어 */
  @Column('text', { name: 'deploy_script' })
  deployScript: string;

  /** 환경변수 목록 */
  @Column('json', { name: 'env', nullable: true })
  env: EnvVar[];

  /** 결과 알림 이메일 */
  @Column({ name: 'notify_email', nullable: true })
  notifyEmail: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

