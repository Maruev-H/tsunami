import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username ?? "";
        const password = credentials?.password ?? "";

        const adminUser = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "tsunami-admin";

        if (username === adminUser && password === adminPassword) {
          return {
            id: "admin",
            name: "Администратор",
            role: "admin",
          } as any;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = (token as any).role ?? "user";
      return session;
    },
  },
});

export { handler as GET, handler as POST };

