import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (url && key) {
      this.client = createClient(url, key);
      this.logger.log('Connected to Supabase client successfully');
    } else {
      this.logger.warn('SUPABASE_URL / KEY not set. Running in local standalone mode.');
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  async verifyToken(token: string): Promise<any | null> {
    if (!this.client) {
      // Mock validation in local standalone mode
      return {
        id: 'usr-1',
        email: 'selam@harborpine.co',
        role: 'owner',
      };
    }

    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      role: (data.user.user_metadata?.role as string) || 'owner',
    };
  }
}
