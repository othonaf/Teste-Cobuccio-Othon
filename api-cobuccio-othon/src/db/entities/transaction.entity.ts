import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  transaction_id: string;

  @Column()
  source_wallet_id: string;

  @Column()
  destination_wallet_id: string;

  @Column('decimal')
  amount: number;

  @Column()
  type: string;

  @Column()
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  reversed_at: Date;

  @Column({ nullable: true })
  reason_for_reversal: string;
}
