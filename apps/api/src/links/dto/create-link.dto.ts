import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotIn, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { RESERVED_SLUGS, SLUG_PATTERN } from '../links.constants.js';

export class CreateLinkDto {
  @ApiProperty({
    description: 'Destination URL (http or https only)',
    example: 'https://nestjs.com/docs/introduction',
    maxLength: 2048,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(2048)
  @IsUrl(
    // require_tld: false lets http://localhost:3000 through during development
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'url must be a valid http or https URL' },
  )
  url!: string;

  // "" (an empty form field) is treated as "not provided" so a slug is generated
  @ApiPropertyOptional({
    description: 'Custom slug. Lowercased automatically. Omit to get a random one.',
    example: 'nest-docs',
    pattern: SLUG_PATTERN.source,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const slug = value.trim().toLowerCase();
    return slug === '' ? undefined : slug;
  })
  @IsOptional()
  @Matches(SLUG_PATTERN, {
    message: 'slug must be 3-32 characters: letters, numbers, "-" or "_"',
  })
  @IsNotIn(RESERVED_SLUGS, { message: 'This slug is reserved, please choose another' })
  slug?: string;
}