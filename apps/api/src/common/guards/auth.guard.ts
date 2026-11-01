import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../modules/supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In local dev/testing without Supabase credentials, fall back to mock demo user
      if (process.env.NODE_ENV !== 'production' && !process.env.SUPABASE_URL) {
        request.user = {
          id: 'usr-demo-1',
          email: 'selam@harborpine.co',
          role: 'owner',
        };
        return true;
      }
      throw new UnauthorizedException({
        code: 'unauthenticated',
        message: 'Missing or invalid Authorization header.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = await this.supabaseService.verifyToken(token);
      if (!user) {
        throw new UnauthorizedException({
          code: 'unauthenticated',
          message: 'Session expired or token invalid.',
        });
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'unauthenticated',
        message: 'Invalid authorization token.',
      });
    }
  }
}
