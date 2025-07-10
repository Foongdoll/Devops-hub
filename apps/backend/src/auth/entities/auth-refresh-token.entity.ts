import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
@Unique(['refreshToken'])
export class RefreshToken {
    @PrimaryGeneratedColumn("uuid")
    refreshTokenCd: string;

    @Column({ nullable: true })    
    refreshToken: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    expirationDate: Date;
}
