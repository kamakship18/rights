import { Module } from '@nestjs/common';
import { NoticeBuilder } from '@repo/shared';

@Module({
  providers: [{ provide: NoticeBuilder, useFactory: () => new NoticeBuilder() }],
  exports: [NoticeBuilder],
})
export class NoticeModule {}
