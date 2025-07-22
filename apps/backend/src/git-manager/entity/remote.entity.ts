import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Remote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  path: string;

}
@Entity()
export class UserRemoteJoin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userCd: string;

  @Column()
  remoteId: string;

  @Column({ default: true })
  status: boolean;
}