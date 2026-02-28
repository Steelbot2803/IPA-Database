import type { SupabaseClient, User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'user' | 'guest';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
			role: AppRole;
		}
		interface PageData {
			user: User | null;
			role: AppRole;
		}
	}
}

export {};
