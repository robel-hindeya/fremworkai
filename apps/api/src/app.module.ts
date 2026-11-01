import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { HealthModule } from './modules/health/health.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DataSourcesModule } from './modules/data-sources/data-sources.module';
import { ChatModule } from './modules/chat/chat.module';
import { OverviewModule } from './modules/overview/overview.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WorkersModule } from './modules/workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    HealthModule,
    WorkspacesModule,
    LedgerModule,
    BudgetsModule,
    GoalsModule,
    ProjectsModule,
    TasksModule,
    DataSourcesModule,
    ChatModule,
    OverviewModule,
    AnalyticsModule,
    WorkersModule,
  ],
})
export class AppModule {}
