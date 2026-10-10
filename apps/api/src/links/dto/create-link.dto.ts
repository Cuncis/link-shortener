import { Transform } from 'class-transformer';
import { IsNotIn, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { RESERVED_SLUGS, SLUG_PATTERN } from '../links.constants.js';

export class CreateLinkDto {
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