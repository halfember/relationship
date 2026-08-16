import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WechatModule } from './wechat/wechat.module';
import { UserModule } from './user/user.module';
import { RelationshipModule } from './relationship/relationship.module';
import { EventModule } from './event/event.module';
import { MemoryModule } from './memory/memory.module';
import { AiModule } from './ai/ai.module';
import { ReminderModule } from './reminder/reminder.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ContactModule } from './contact/contact.module';
import { VoiceModule } from './voice/voice.module';
import { ExportModule } from './export/export.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { SpaceModule } from './space/space.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        if (config.NODE_ENV === 'production') {
          const required = [
            'WECHAT_APPID',
            'WECHAT_SECRET',
            'WECHAT_REMINDER_TEMPLATE_ID',
            'AUTH_SECRET',
            'PUBLIC_BASE_URL',
            'CORS_ORIGIN',
          ];
          const missing = required.filter((key) => !config[key]);
          if (missing.length > 0) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
          if (!/^https:\/\//.test(config.PUBLIC_BASE_URL)) {
            throw new Error('PUBLIC_BASE_URL must use HTTPS in production');
          }
        }
        return config;
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    WechatModule,
    UserModule,
    RelationshipModule,
    EventModule,
    MemoryModule,
    AiModule,
    ReminderModule,
    AnalyticsModule,
    ContactModule,
    VoiceModule,
    ExportModule,
    UploadModule,
    SpaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
