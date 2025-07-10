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

    @JoinColumn({ name: "roleCd" })
    @ManyToOne( () => Role, { eager: true })
    role: Role;
    
    @JoinColumn({ name: "refreshTokenCd" })
    @ManyToOne( () => RefreshToken, { eager: true })
    refreshToken: RefreshToken;    
}
