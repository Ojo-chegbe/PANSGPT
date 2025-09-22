import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma } from "@prisma/client";
import { isValidDeviceId } from "./device-id";
import { createId } from '@paralleldrive/cuid2';

// Define interface for Session management
interface Session {
  id: string;          // A unique ID for this session/login instance
  loggedInAt: string;  // ISO string timestamp of login
  ipAddress?: string;  // The IP address of the user
  userAgent?: string;  // The user agent string from the browser
}

export const authOptions: NextAuthOptions = {
  // Remove adapter for credentials provider - we'll handle sessions manually
  // adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        clientDeviceId: { label: "Client Device ID", type: "text" },
        userAgent: { label: "User Agent", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            console.log("User not found or no password:", credentials.email);
            return null;
          }

          // Verify the password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          // --- SIMPLIFIED SESSION MANAGEMENT ---
          const clientDeviceId = credentials.clientDeviceId;
          if (!clientDeviceId) {
            console.log("Missing client device ID");
            return null;
          }

          // Validate device ID format
          if (!isValidDeviceId(clientDeviceId)) {
            console.log("Invalid device ID format");
            return null;
          }

          // Get current sessions. Default to an empty array if null.
          let currentSessions: Session[] = (user.activeSessions as Session[]) || [];

          // Check if the session limit is reached
          if (currentSessions.length >= 2) {
            // Sort sessions by login date, oldest first
            currentSessions.sort((a, b) => new Date(a.loggedInAt).getTime() - new Date(b.loggedInAt).getTime());
            
            // Remove the oldest session (the first element after sorting)
            currentSessions.shift(); 
          }

          // Create the new session object for this login
          const newSession: Session = {
            id: createId(), // Generate a new unique ID
            loggedInAt: new Date().toISOString(),
            ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] as string || 'unknown',
            userAgent: (req && req.headers && req.headers["user-agent"] as string) || credentials.userAgent,
          };

          // Add the new session to the array
          currentSessions.push(newSession);

          // Update the user record in the database with the new session list
          await prisma.user.update({
            where: { id: user.id },
            data: {
              activeSessions: currentSessions,
            },
          });

          const userAgent =
            (req && req.headers && req.headers["user-agent"] as string) || credentials.userAgent;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            clientDeviceId: clientDeviceId,
            userAgent: userAgent,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ }) {
      // Removed manual prisma.account.upsert for Google provider
      return true;
    },
    async session({ session, token }) {
      // If token has an error (user not found), return null session
      if (token.error) {
        console.log('Session invalidated due to token error:', token.error);
        return null;
      }

      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.clientDeviceId = token.clientDeviceId as string;
        session.user.userAgent = token.userAgent as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in - set user data in token
        token.sub = user.id;
        token.clientDeviceId = user.clientDeviceId;
        token.userAgent = user.userAgent;
        return token;
      }

      // On subsequent calls, validate that the user still exists in the database
      if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { id: true, email: true, name: true }
          });

          if (!dbUser) {
            // User no longer exists in database - invalidate token
            console.log('User no longer exists in database, invalidating token:', token.sub);
            return { ...token, error: "User not found" };
          }

          // User exists, update token with current data
          token.email = dbUser.email;
          token.name = dbUser.name;
        } catch (error) {
          console.error('Error validating user in JWT callback:', error);
          // On database error, allow the token to continue (fail gracefully)
          return token;
        }
      }

      return token;
    },
  },
  events: {
    async signIn(message) {
      if (message.user.id && message.account?.provider === "credentials") {
        const clientDeviceId = message.user.clientDeviceId;
        const userAgent = message.user.userAgent;

        const latestSession = await prisma.session.findFirst({
          where: {
            userId: message.user.id,
            clientDeviceId: clientDeviceId,
          },
          orderBy: { expires: 'desc' },
        });

        if (latestSession) {
          await prisma.session.update({
            where: { id: latestSession.id },
            data: {
              userAgent: userAgent,
            },
          });
        } else if ((message as any).session) {
          // Only update if message.session exists
           await prisma.session.update({
            where: { sessionToken: (message as any).session.sessionToken },
            data: {
              clientDeviceId: clientDeviceId,
              userAgent: userAgent,
            },
          });
        }
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
}; 