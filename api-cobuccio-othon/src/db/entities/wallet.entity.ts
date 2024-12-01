import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('wallet')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  wallet_id: string;

  @Column({ type: 'varchar', length: 11 })
  user_cpf: string;

  @Column('float')
  balance: number;

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  last_updated: Date;

  @Column({ default: 'active', length: 20 })
  status: string;

  @Column({ default: 'BRL', length: 3 })
  currency: string;

  @Column({ length: 50 })
  account_type: string;

  @ManyToOne(() => UserEntity, user => user.wallets)
  @JoinColumn({ name: 'user_cpf', referencedColumnName: 'cpf' })
  user: UserEntity;
}
