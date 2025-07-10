import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { RoleType } from "../enum/role.enum";

@Entity()
@Unique(['roleName'])
export class Role {
    @PrimaryGeneratedColumn("uuid")
    roleCd: string;

    @Column()    
    roleName: RoleType;
  
}
