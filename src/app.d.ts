import type { SupabaseClient, User } from '@supabase/supabase-js';

type AppRole = 'ADMIN' | 'USER' | 'GUEST';

declare global {
	namespace App {
		interface Locals { supabase: SupabaseClient; user: User | null; role: AppRole }
		interface PageData { user: User | null; role: AppRole }

		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties
		}
	}
}

export {};
