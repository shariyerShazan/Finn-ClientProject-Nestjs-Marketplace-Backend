import { IsString, IsEmail, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AdminCreateSellerDto {
  @ApiProperty({ example: 'John', description: 'First name of the seller' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john_seller' })
  @IsString()
  @IsNotEmpty()
  nickName: string;

  @ApiProperty({ example: 'seller@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Tech Ltd' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'https://johntech.com' })
  @IsString()
  @IsNotEmpty()
  companyWebSite: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 1212 })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  zip: number;

  @ApiProperty({ example: 'Bangladesh' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class AdminUpdateSellerDto extends PartialType(AdminCreateSellerDto) {}
