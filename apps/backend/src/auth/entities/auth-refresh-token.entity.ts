import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
@Unique(['refreshToken'])
export class RefreshToken {
    @PrimaryGeneratedColumn("uuid")
    refreshTokenCd: string;

    @Column({ nullable: true, type: 'varchar', length: 500, default: '' })
    refreshToken: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    expirationDate: Date;
}
