import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type SessionType = 'SSH' | 'FTP' | 'SFTP';
export type PlatformType = 'AWS' | 'Oracle' | 'Azure' | 'GCP' | 'Local' | 'Other';

@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column({ type: 'enum', enum: ['SSH','FTP','SFTP'], default: 'SSH' })
  type: SessionType;

  @Column({ type: 'enum', enum: ['AWS', 'Oracle', 'Azure', 'GCP', 'Local', 'Other'], default: 'Local' })
  platform: PlatformType;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  authMethod: 'password' | 'key';

  @Column({ nullable: true })
  password?: string;

  @Column({ type: 'text', nullable: true })
  privateKey?: string;
}