import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";

dotenv.config();

const DEMO_URL = "http://localhost:3005";
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

// ============================================
// TOKEN MANAGEMENT
// ============================================

export async function getStoredToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data);
    return token;
  } catch (error) {
    return null;
  }
}

export async function storeToken(token) {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type || "Bearer",
      scope: token.scope,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(chalk.red("Failed to store token:"), error.message);
    return false;
  }
}

export async function clearStoredToken() {
  try {
    await fs.unlink(TOKEN_FILE);
    return true;
  } catch (error) {
    return false;
  }
}

export async function isTokenExpired() {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  return now >= expiresAt;
}

export async function requireAuth() {
  const token = await getStoredToken();
  if (!token?.access_token) {
    console.log(chalk.red("Not authenticated. Please run 'genai login' first."));
    process.exit(1);
  }
  return token;
}

// ============================================
// LOGIN COMMAND
// ============================================

export async function loginAction(opts) {
  const options = z
    .object({
      serverUrl: z.string().optional(),
      clientId: z.string().optional(),
    })
    .parse(opts);

  intro(chalk.bold("🔐 GenAI CLI Login"));

  // Check if already logged in
  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    const shouldReauth = await confirm({
      message: "You're already logged in. Do you want to log in again?",
      initialValue: false,
    });

    if (isCancel(shouldReauth) || !shouldReauth) {
      cancel("Login cancelled");
      process.exit(0);
    }
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." });
  spinner.start();

  try {
    // Create or get a test user from the database
    const user = await prisma.user.upsert({
      where: { email: "cli-user@genai.dev" },
      update: {},
      create: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: "cli-user@genai.dev",
        name: "CLI User",
        emailVerified: true,
      },
    });

    // Create a session for this user
    const session = await prisma.session.create({
      data: {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        token: `cli_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    spinner.stop();

    // Store the token
    const tokenData = {
      access_token: session.token,
      token_type: "Bearer",
      scope: "openid profile email",
      expires_at: session.expiresAt.toISOString(),
    };

    await storeToken(tokenData);

    console.log("");
    console.log(chalk.green("✅ Authentication successful!"));
    console.log("");
    console.log(chalk.cyan("📋 User Information:"));
    console.log(`   Name: ${chalk.bold(user.name)}`);
    console.log(`   Email: ${chalk.bold(user.email)}`);
    console.log(`   User ID: ${chalk.gray(user.id)}`);
    console.log("");
    console.log(chalk.yellow("💡 Next steps:"));
    console.log(`   Run: ${chalk.bold("genai wakeup")} - Start an AI conversation`);
    console.log(`   Run: ${chalk.bold("genai whoami")} - Check your user info`);
    console.log(`   Run: ${chalk.bold("genai logout")} - Logout`);
    console.log("");

    outro(chalk.green("🎉 Ready to use GenAI CLI!"));
    process.exit(0);
  } catch (error) {
    spinner.stop();
    console.log(chalk.red("\n❌ Authentication failed:"));
    console.log(chalk.red(error.message));
    process.exit(1);
  }
}

// ============================================
// LOGOUT COMMAND
// ============================================

export async function logoutAction() {
  intro(chalk.bold("👋 Logout"));

  const token = await getStoredToken();

  if (!token) {
    console.log(chalk.yellow("You're not logged in."));
    process.exit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you sure you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled");
    process.exit(0);
  }

  const cleared = await clearStoredToken();

  if (cleared) {
    outro(chalk.green("✅ Successfully logged out!"));
  } else {
    console.log(chalk.yellow("⚠️  Could not clear token file."));
  }
}

// ============================================
// WHOAMI COMMAND
// ============================================

export async function whoamiAction(opts) {
  const token = await requireAuth();
  if (!token?.access_token) {
    console.log("No access token found. Please login.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    console.log(chalk.red("User not found."));
    process.exit(1);
  }

  // Output user info
  console.log("");
  console.log(chalk.bold.greenBright(`👤 User: ${user.name}`));
  console.log(chalk.bold.greenBright(`📧 Email: ${user.email}`));
  console.log(chalk.bold.greenBright(`👤 ID: ${user.id}`));
  console.log("");
}

// ============================================
// COMMANDER SETUP
// ============================================

export const login = new Command("login")
  .description("Login to Better Auth")
  .option("--server-url <url>", "The Better Auth server URL", DEMO_URL)
  .option("--client-id <id>", "The OAuth client ID")
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout and clear stored credentials")
  .action(logoutAction);

export const whoami = new Command("whoami")
  .description("Show current authenticated user")
  .option("--server-url <url>", "The Better Auth server URL", DEMO_URL)
  .action(whoamiAction);
