import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      roles?: string[];
      departments?: Array<{ id: string; name?: string } | string>;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username?: string | null;
    roles?: string[];
    departments?: Array<{ id: string; name?: string } | string>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    username?: string | null;
    roles?: string[];
    departments?: Array<{ id: string; name?: string } | string>;
  }
}

export {};
