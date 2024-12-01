import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { WalletEntity } from './wallet.entity';

@Entity('user')
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 11 })
  cpf: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 255 })
  endereco: string;

  @Column({ type: 'varchar', length: 11 })
  telefone: string;

  @Column({ length: 40 })
  email: string;

  @Column({ length: 150 })
  senha: string;

  @OneToMany(() => WalletEntity, wallet => wallet.user)
  wallets: WalletEntity[];
}
