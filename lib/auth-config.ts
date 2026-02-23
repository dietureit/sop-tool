import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Department from '@/models/Department';
import AuditLog from '@/models/AuditLog';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = (credentials?.username ?? '').toString().trim();
        const password = (credentials?.password ?? '').toString();
        if (!username || !password) {
          return null;
        }
        await connectDB();
        const user = await User.findOne({ username, isActive: true }).populate('departments', 'name _id');
        if (!user || !(await user.checkPassword(password))) {
          return null;
        }
        try {
          await connectDB();
          await AuditLog.create({
            user: user._id,
            action: 'login',
            resourceType: 'User',
            resourceId: user._id,
          });
        } catch (_) {}
        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          roles: user.roles || [],
          departments: user.departments?.map((d) => ({ id: d._id.toString(), name: d.name })) || [],
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.roles = user.roles;
        token.departments = user.departments;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.roles = token.roles;
        session.user.departments = token.departments;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
