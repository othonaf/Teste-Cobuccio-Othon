import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSourceOptions, DataSource } from 'typeorm';
import { WalletEntity } from './entities/wallet.entity';
import { UserEntity } from './entities/user.entity';

config();

const configService = new ConfigService();

const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: configService.get<string>('MYSQL_HOST'),
  port: +configService.get<number>('MYSQL_PORT'),
  username: configService.get<string>('MYSQL_USER'),
  password: configService.get<string>('MYSQL_ROOT_PASSWORD'),
  database: configService.get<string>('MYSQL_DATABASE'),
  entities: [WalletEntity, UserEntity],
  migrations: [__dirname + '/migration/*.ts'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
