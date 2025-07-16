import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Role } from "./auth-role.entity";
import { RefreshToken } from "./auth-refresh-token.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    userCd: string;

    @Column()
    @Unique(["userId"])
    userId: string;

    @Column()
    userPw: string;

    @Column()
    userName: string;

    @Column({ nullable: true})
    refreshTokenCd: string;

    @Column()
    roleCd: string;

    @JoinColumn({ name: "roleCd" })
    @ManyToOne(() => Role, { eager: true })
    role: Role;

    @ManyToOne(() => RefreshToken, { eager: true, nullable: true })
    @JoinColumn({ name: "refreshTokenCd" }) 
    refreshToken: RefreshToken | null;
}
