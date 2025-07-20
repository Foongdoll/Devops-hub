import { IsNotEmpty, IsString } from "class-validator";

export class AddRemoteDto {
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  path: string;
}