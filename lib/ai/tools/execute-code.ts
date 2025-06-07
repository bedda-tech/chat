import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for safely executing Python code snippets
 * Demonstrates AI SDK tool execution capabilities
 */
export const executeCodeTool = () =>
  tool({
    description:
      "Execute Python code safely in a sandboxed environment. Use this when users want to run, test, or execute Python code snippets. Do NOT use for complex scripts or those requiring external dependencies.",
    inputSchema: z.object({
      code: z
        .string()
        .describe(
          "The Python code to execute. Must be safe, self-contained, and use only standard library."
        ),
      description: z
        .string()
        .optional()
        .describe("Optional description of what the code does"),
    }),
    execute: async ({ code, description }) => {
      try {
        // In a real implementation, this would execute in a secure sandbox
        // For now, we'll simulate execution and return expected output
        
        // Basic validation
        const dangerousPatterns = [
          "import os",
          "import sys",
          "import subprocess",
          "open(",
          "exec(",
          "eval(",
          "__import__",
          "compile(",
        ];

        const hasDangerousCode = dangerousPatterns.some((pattern) =>
          code.toLowerCase().includes(pattern.toLowerCase())
        );

        if (hasDangerousCode) {
          return {
            success: false,
            error:
              "Code contains potentially dangerous operations. Please use only safe, standard library functions.",
          };
        }

        // Simulate execution (in production, use a proper sandbox like Pyodide or serverless function)
        return {
          success: true,
          code,
          description,
          output: "Code execution simulation: This feature requires a secure code execution environment to be fully functional.",
          executionTime: "0ms",
          language: "python",
          note: "To enable real code execution, integrate with a sandboxed Python runtime like Pyodide or use serverless functions.",
        };
      } catch (error) {
        console.error("Code execution error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to execute code. Please try again.",
        };
      }
    },
  });

