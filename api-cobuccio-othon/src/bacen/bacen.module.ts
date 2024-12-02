import { Module } from '@nestjs/common';
import { MockBacenService } from './bacen.service';

@Module({
  providers: [MockBacenService],
  exports: [MockBacenService],
})
export class BacenModule {}
