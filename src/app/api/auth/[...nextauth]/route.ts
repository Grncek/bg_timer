import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a mock authorization logic
        // In a real app, you would check this against a database
        if (credentials?.username === "admin" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@example.com",
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
