export interface JwtPayload {
  sub: string;
  userId: string;
  roles: { roleCd: string; roleName : string }[];
}
