export interface JwtPayload {
  sub: string;
  userId: string;
  roles: string[];
}
