import { PartialType } from '@nestjs/swagger';
import { CreateSellerProfileDto } from '../../user/dto/create-seller-profile.dto';

export class UpdateSellerProfileDto extends PartialType(
  CreateSellerProfileDto,
) {}
