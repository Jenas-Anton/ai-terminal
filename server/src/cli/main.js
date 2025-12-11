#!/usr/bin/env node

import dotenv from "dotenv";

import chalk from "chalk";
import figlet from "figlet";
import chalkAnimation from "chalk-animation";

import { Command } from "commander";

import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeUp } from "./commands/ai/wakeUp.js";

dotenv.config();

async function main() {
  // Generate ASCII text
  const ascii = figlet.textSync("Custom CLI", {
    font: "Big",
    horizontalLayout: "default",
  });
  
  
  const animation = chalkAnimation.neon(ascii);

  // Wait for animation duration (milliseconds)
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Stop animation and keep the final colored frame
  animation.stop();

  // Small subtitle / tagline after the banner
  console.log(chalk.gray("A CLI based AI tool \n"));

  const program = new Command("genai");

  program
    .version("0.0.1")
    .description("GenAI CLI - Device Flow Authentication");

  // Add commands
  program.addCommand(wakeUp);
  program.addCommand(login);
  program.addCommand(logout);
  program.addCommand(whoami);

  // Default action shows help
  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((error) => {
  console.error(chalk.red("Error running GenAI CLI:"), error);
  process.exit(1);
});
