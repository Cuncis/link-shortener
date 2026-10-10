import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, IsUrl, Matches, Max, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  @Matches(/^mysql:\/\/.+/, { message: 'DATABASE_URL must start with mysql://' })
  DATABASE_URL!: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  BASE_URL: string = 'http://localhost:3001';

  @IsUrl({ require_tld: false, require_protocol: true })
  CORS_ORIGIN: string = 'http://localhost:3000';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // "3001" -> 3001
  });

  const errors = validateSync(validated);

  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}