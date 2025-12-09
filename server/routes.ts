import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema,
  insertChatMessageSchema,
  insertCodeExecutionSchema,
  insertUserConfigSchema,
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import multer from "multer";
import AdmZip from "adm-zip";

// ========================================================
// AUTH CONFIG
// ========================================================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const tokens = new Set<string>();
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ========================================================
// OPENAI CONFIG - Supports both Replit AI Integrations & Own Key
// ========================================================
function getOpenAI(customKey?: string): OpenAI | null {
  // Priority: Custom key > Replit AI Integrations > Env key
  if (customKey) {
    return new OpenAI({ apiKey: customKey });
  }
  if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    return new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
}

// ========================================================
// FILE UPLOAD (MULTER)
// ========================================================
const upload = multer({
  dest: path.join(os.tmpdir(), "vipu-uploads"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// ========================================================
// VIPU SYSTEM PROMPT - Empathetic AI Assistant (for Chat)
// Named after Balaji's daughter Vipu - SHORT. SHARP. MEMORABLE.
// ========================================================
const VIPU_SYSTEM_PROMPT = `You are VipuDevAI - an empathetic, highly intelligent AI development assistant.

🌟 PERSONALITY (Named after Vipu - Balaji's beloved daughter):
- You are warm, caring, and genuinely helpful - like a supportive family member
- You celebrate user's successes with genuine joy
- You provide comfort and encouragement when they're stuck
- You never say "I can't" - you always find a way to help
- You speak with confidence but remain humble and approachable
- You use "machi" affectionately when appropriate (Tamil for friend/buddy)

💻 TECHNICAL EXCELLENCE:
- You are a senior full-stack developer with 15+ years of experience
- You provide production-ready, clean, well-documented code
- You explain complex concepts simply without being condescending
- You anticipate edge cases and handle errors gracefully
- You follow best practices: security, performance, accessibility
- You support: JavaScript, TypeScript, Python, React, Node.js, databases, APIs, DevOps

🧠 INTELLIGENCE:
- You think step-by-step before responding
- You ask clarifying questions when requirements are unclear
- You provide multiple approaches when appropriate
- You learn from conversation context and remember previous discussions
- You proactively suggest improvements and optimizations

📋 RESPONSE FORMAT:
- For code: Use proper syntax highlighting with language tags
- For explanations: Use clear headings, bullet points, numbered steps
- For debugging: Show the problem, explain why, provide the fix
- Keep responses focused but comprehensive
- End with next steps or suggestions when helpful

Remember: You're not just an AI - you're VipuDevAI, built with love by Balaji for developers worldwide. Make every interaction meaningful! 💚`;

// ========================================================
// VIPU APP BUILDER PROMPT - Generative Developer Agent
// Generates complete full-stack applications with file structures
// ========================================================
const VIPU_BUILDER_PROMPT = `You are VipuDevAI App Builder - a GENERATIVE DEVELOPER AGENT that builds complete full-stack applications.

🚀 YOUR MISSION:
You DO NOT provide instructions or explanations. You GENERATE COMPLETE, RUNNABLE CODE for entire applications.
When a user requests any system (school management, chat app, ERP, AI service, etc.), you IMMEDIATELY generate ALL necessary files.

📁 OUTPUT FORMAT - MANDATORY:
You MUST output files in this EXACT format. Each file MUST start with "FILE:" on its own line:

FILE: package.json
\`\`\`json
{
  "name": "project-name",
  "version": "1.0.0",
  ...
}
\`\`\`

FILE: .env.example
\`\`\`
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
\`\`\`

FILE: src/index.ts
\`\`\`typescript
import express from 'express';
...
\`\`\`

🏗️ WHAT YOU GENERATE FOR EVERY PROJECT:

1. **Project Configuration**
   - package.json with all dependencies
   - tsconfig.json / jsconfig.json
   - .env.example with all required variables
   - .gitignore

2. **Backend (Node.js/Express or Python/FastAPI)**
   - Entry point (index.ts/main.py)
   - Routes/Controllers
   - Database models/schema
   - Middleware (auth, validation, error handling)
   - API endpoints (RESTful)
   - Database migrations

3. **Frontend (React/Vue/Vanilla)**
   - Main App component
   - Pages/Views
   - Components (reusable UI)
   - Styles (CSS/Tailwind)
   - API client/services
   - State management

4. **Database**
   - Schema definitions (Drizzle/Prisma/SQLAlchemy)
   - Seed data if needed
   - Migration files

5. **Deployment**
   - Dockerfile (if needed)
   - docker-compose.yml
   - render.yaml / vercel.json / railway.toml
   - README.md with setup instructions

🎯 RULES:
1. NEVER say "here's how to build..." - JUST BUILD IT
2. NEVER ask clarifying questions - make smart assumptions
3. ALWAYS generate production-ready, secure code
4. ALWAYS include proper error handling
5. ALWAYS use TypeScript when possible
6. ALWAYS include comments in complex logic
7. ALWAYS generate a complete folder structure
8. ALWAYS include a README with:
   - Project overview
   - Tech stack
   - Setup instructions (npm install, env setup)
   - Running instructions
   - API documentation

💡 TECH STACK PREFERENCES:
- Backend: Node.js + Express + TypeScript (default) or Python + FastAPI
- Frontend: React + TypeScript + Tailwind CSS
- Database: PostgreSQL with Drizzle ORM
- Auth: JWT tokens or session-based
- Validation: Zod for TypeScript, Pydantic for Python

🎨 DESIGN:
- Modern, clean UI with proper spacing
- Responsive design (mobile-first)
- Accessible (ARIA labels, semantic HTML)
- Professional color schemes

Remember: You are VipuDevAI - SHORT. SHARP. EXECUTE... 
Generate the ENTIRE application. No shortcuts. No explanations. Just CODE.`;

// ========================================================
// MEMORY BUILDER - Contextual Conversation
// ========================================================
async function buildConversation(
  userMessages: { role: "user" | "assistant" | "system"; content: string }[],
  codeContext?: string,
  projectId?: string | null
): Promise<{ role: "user" | "assistant" | "system"; content: string }[]> {
  let memoryText = "";

  try {
    const history = await storage.getChatMessages(30, projectId ?? null);
    memoryText = history
      .slice(-20) // Last 20 messages for context
      .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`)
      .join("\n");
  } catch (err) {
    console.error("Memory fetch error:", err);
  }

  const systemMessage = {
    role: "system" as const,
    content: `${VIPU_SYSTEM_PROMPT}

📚 CONVERSATION MEMORY:
${memoryText || "(Starting fresh conversation)"}

${codeContext ? `📝 CURRENT CODE CONTEXT:\n\`\`\`\n${codeContext.slice(0, 3000)}\n\`\`\`` : ""}

Respond with empathy, precision, and your signature VipuDevAI excellence!`,
  };

  return [systemMessage, ...userMessages];
}

// ========================================================
// REAL-TIME WEB SEARCH (Basic)
// ========================================================
async function searchWeb(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`
    );
    const data = await response.json();

    let results: string[] = [];

    if (data.Abstract) {
      results.push(`📖 ${data.Abstract}`);
    }
    if (data.Answer) {
      results.push(`✅ ${data.Answer}`);
    }
    if (data.RelatedTopics?.length > 0) {
      const topics = data.RelatedTopics.slice(0, 3)
        .filter((t: any) => t.Text)
        .map((t: any) => `• ${t.Text}`);
      if (topics.length > 0) {
        results.push("Related:\n" + topics.join("\n"));
      }
    }

    return results.length > 0
      ? results.join("\n\n")
      : "No instant results found. Using AI knowledge instead.";
  } catch (err) {
    console.error("Web search error:", err);
    return "Search temporarily unavailable. Using AI knowledge.";
  }
}

// ========================================================
// PERPLEXITY-STYLE NLU & INTELLIGENT SEARCH MODULE
// Natural Language Understanding with Query Rewriting,
// Intent Detection, Reasoning, and Structured Responses
// ========================================================
interface SearchSource {
  title: string;
  snippet: string;
  url?: string;
}

interface NLUResult {
  originalQuery: string;
  rewrittenQuery: string;
  intent: string;
  searchResults: SearchSource[];
  synthesizedAnswer: string;
  reasoning: string;
  confidence: number;
}

const NLU_SYSTEM_PROMPT = `You are VipuDevAI's Intelligent Search Engine - a Perplexity-style AI that provides clear, well-researched answers.

🧠 YOUR CAPABILITIES:
1. **Intent Understanding**: Clearly understand what the user is really asking
2. **Query Optimization**: Rewrite queries for maximum clarity and searchability
3. **Information Synthesis**: Combine multiple sources into coherent answers
4. **Clear Reasoning**: Show your thinking process transparently
5. **Professional Formatting**: Structure responses for easy reading

📋 RESPONSE FORMAT (JSON):
You MUST respond with valid JSON in this exact format:
{
  "rewrittenQuery": "optimized search query",
  "intent": "brief description of user intent (1 sentence)",
  "reasoning": "step-by-step reasoning about the query (2-3 sentences)",
  "answer": "comprehensive answer with clear paragraphs",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sources": ["source description 1", "source description 2"],
  "confidence": 0.95,
  "followUpQuestions": ["related question 1", "related question 2"]
}

🎯 GUIDELINES:
- Be factual, accurate, and up-to-date
- Cite sources when making specific claims
- Use bullet points and headers for clarity
- Provide balanced perspectives on controversial topics
- Admit uncertainty rather than fabricate information
- Keep answers comprehensive but concise
- Include relevant context the user might not have asked for but would find valuable

Remember: You're VipuDevAI - SHORT. SHARP. ACCURATE. 💚`;

async function performIntelligentSearch(query: string): Promise<SearchSource[]> {
  const sources: SearchSource[] = [];
  
  try {
    // Search DuckDuckGo for instant answers
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`
    );
    const data = await response.json();

    if (data.Abstract) {
      sources.push({
        title: data.Heading || "Encyclopedia",
        snippet: data.Abstract,
        url: data.AbstractURL
      });
    }

    if (data.Answer) {
      sources.push({
        title: "Direct Answer",
        snippet: data.Answer,
      });
    }

    // Add related topics as sources
    if (data.RelatedTopics?.length > 0) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text) {
          sources.push({
            title: topic.FirstURL ? topic.FirstURL.split('/').pop()?.replace(/_/g, ' ') || "Related" : "Related Topic",
            snippet: topic.Text,
            url: topic.FirstURL
          });
        }
      });
    }

    // Search Wikipedia for additional context
    try {
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
      );
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        if (wikiData.extract && !sources.some(s => s.snippet === wikiData.extract)) {
          sources.push({
            title: wikiData.title || "Wikipedia",
            snippet: wikiData.extract,
            url: wikiData.content_urls?.desktop?.page
          });
        }
      }
    } catch {}

  } catch (err) {
    console.error("Intelligent search error:", err);
  }

  return sources;
}

async function processNLUQuery(
  query: string,
  openai: OpenAI,
  searchResults: SearchSource[]
): Promise<any> {
  try {
    const searchContext = searchResults.length > 0
      ? searchResults.map((s, i) => `[${i + 1}] ${s.title}: ${s.snippet}`).join("\n\n")
      : "No external search results available.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: NLU_SYSTEM_PROMPT },
        {
          role: "user",
          content: `User Query: "${query}"

Search Results:
${searchContext}

Analyze this query and provide a comprehensive, well-structured answer in the JSON format specified.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("NLU processing error:", err);
    return {
      rewrittenQuery: query,
      intent: "General information request",
      reasoning: "Processing the query directly.",
      answer: "I encountered an issue processing your query. Please try again.",
      keyPoints: [],
      sources: [],
      confidence: 0.5,
      followUpQuestions: []
    };
  }
}

// ========================================================
// ROUTES
// ========================================================
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ======================================================
  // HEALTH CHECK
  // ======================================================
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "VipuDevAI",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // ======================================================
  // AUTH ROUTES
  // ======================================================
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateToken();
      tokens.add(token);
      return res.json({ token, message: "Welcome to VipuDevAI! 💚" });
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  app.get("/api/auth/verify", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && tokens.has(token)) {
      return res.json({ valid: true });
    }
    res.status(401).json({ error: "Invalid token" });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) tokens.delete(token);
    res.json({ message: "Goodbye! Come back soon! 💚" });
  });

  // ======================================================
  // PROJECT CRUD
  // ======================================================
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json({ projects });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ project });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.status(201).json({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const data = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, data);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ======================================================
  // CHAT HISTORY
  // ======================================================
  app.get("/api/chat/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const projectId = (req.query.projectId as string) || null;
      const messages = await storage.getChatMessages(limit, projectId);
      res.json({ messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const data = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(data);
      res.status(201).json({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message" });
      }
      res.status(500).json({ error: "Failed to save message" });
    }
  });

  app.delete("/api/chat/history", async (req, res) => {
    try {
      const projectId = (req.query.projectId as string) || null;
      await storage.clearChatHistory(projectId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  // ======================================================
  // CODE EXECUTIONS
  // ======================================================
  app.get("/api/executions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const executions = await storage.getCodeExecutions(limit);
      res.json({ executions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch executions" });
    }
  });

  app.post("/api/executions", async (req, res) => {
    try {
      const data = insertCodeExecutionSchema.parse(req.body);
      const execution = await storage.createCodeExecution(data);
      res.status(201).json({ execution });
    } catch (error) {
      res.status(400).json({ error: "Invalid execution data" });
    }
  });

  // ======================================================
  // CONFIG
  // ======================================================
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await storage.getConfig();
      res.json({ config: config || {} });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const data = insertUserConfigSchema.parse(req.body);
      const config = await storage.updateConfig(data);
      res.json({ config });
    } catch (error) {
      res.status(400).json({ error: "Invalid config" });
    }
  });

  // ======================================================
  // VIPU AI ASSISTANT - The Heart of VipuDevAI 💚
  // ======================================================
  app.post("/api/assistant/chat", async (req, res) => {
    const { messages, codeContext, projectId, apiKey, searchEnabled } = req.body;

    const openai = getOpenAI(apiKey);
    if (!openai) {
      return res.status(400).json({
        error: "OpenAI API key required",
        hint: "Please add your OpenAI API key in Config or DALL·E page",
      });
    }

    try {
      let searchResults = "";

      // Real-time search if enabled and query looks like a question
      if (searchEnabled && messages?.length > 0) {
        const lastMessage = messages[messages.length - 1]?.content || "";
        const isQuestion =
          lastMessage.includes("?") ||
          lastMessage.toLowerCase().startsWith("what") ||
          lastMessage.toLowerCase().startsWith("how") ||
          lastMessage.toLowerCase().startsWith("why") ||
          lastMessage.toLowerCase().startsWith("when") ||
          lastMessage.toLowerCase().startsWith("who") ||
          lastMessage.toLowerCase().includes("latest") ||
          lastMessage.toLowerCase().includes("current") ||
          lastMessage.toLowerCase().includes("2024") ||
          lastMessage.toLowerCase().includes("2025");

        if (isQuestion) {
          searchResults = await searchWeb(lastMessage);
        }
      }

      // Build conversation with memory
      const conversation = await buildConversation(
        messages || [],
        codeContext,
        projectId
      );

      // Add search results if available
      if (searchResults) {
        conversation.push({
          role: "system",
          content: `🔍 REAL-TIME WEB SEARCH RESULTS:\n${searchResults}\n\nUse this information to provide accurate, up-to-date responses.`,
        });
      }

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Best model for coding
        messages: conversation,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const reply = completion.choices[0]?.message?.content || "";

      // Save to memory
      if (messages?.length > 0) {
        const lastUserMsg = messages[messages.length - 1];
        try {
          await storage.createChatMessage({
            role: "user",
            content: lastUserMsg.content,
            projectId: projectId || null,
          });
          await storage.createChatMessage({
            role: "assistant",
            content: reply,
            projectId: projectId || null,
          });
        } catch (err) {
          console.error("Failed to save chat:", err);
        }
      }

      res.json({
        reply,
        searchUsed: !!searchResults,
        model: "gpt-4o",
      });
    } catch (error: any) {
      console.error("Assistant error:", error);
      res.status(500).json({
        error: "Assistant temporarily unavailable",
        details: error.message,
      });
    }
  });

  // ======================================================
  // INTELLIGENT SEARCH - Perplexity-style NLU Search 🔍
  // ======================================================
  app.post("/api/assistant/search", async (req, res) => {
    const { query, apiKey } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    const openai = getOpenAI(apiKey);
    if (!openai) {
      return res.status(400).json({
        error: "OpenAI API key required",
        hint: "Please add your OpenAI API key in the Chat page",
      });
    }

    try {
      // Step 1: Perform intelligent web search
      const searchSources = await performIntelligentSearch(query);

      // Step 2: Process with NLU
      const nluResult = await processNLUQuery(query, openai, searchSources);

      // Step 3: Format response
      res.json({
        success: true,
        query: query,
        rewrittenQuery: nluResult.rewrittenQuery || query,
        intent: nluResult.intent || "Information request",
        reasoning: nluResult.reasoning || "",
        answer: nluResult.answer || "Unable to generate answer.",
        keyPoints: nluResult.keyPoints || [],
        sources: searchSources.map((s) => ({
          title: s.title,
          snippet: s.snippet.slice(0, 200),
          url: s.url,
        })),
        aiSources: nluResult.sources || [],
        confidence: nluResult.confidence || 0.8,
        followUpQuestions: nluResult.followUpQuestions || [],
        model: "gpt-4o",
        searchTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Intelligent search error:", error);
      res.status(500).json({
        error: "Search temporarily unavailable",
        details: error.message,
      });
    }
  });

  // ======================================================
  // CODE EXECUTION - Run JS/Python Code
  // ======================================================
  app.post("/api/run", async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const isPython = language === "python";
    const ext = isPython ? ".py" : ".js";
    const cmd = isPython ? "python3" : "node";

    try {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vipu-run-"));
      const filePath = path.join(tempDir, `main${ext}`);

      fs.writeFileSync(filePath, code);

      exec(
        `${cmd} "${filePath}"`,
        { timeout: 10000, maxBuffer: 1024 * 1024 },
        (error, stdout, stderr) => {
          // Cleanup
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch {}

          res.json({
            stdout: stdout || "",
            stderr: stderr || "",
            exitCode: error?.code || 0,
            language,
            success: !error,
          });
        }
      );
    } catch (error: any) {
      res.status(500).json({ error: "Execution failed", details: error.message });
    }
  });

  // ======================================================
  // IMAGE GENERATION - DALL·E
  // ======================================================
  app.post("/api/generate-image", async (req, res) => {
    const { prompt, size, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const openai = getOpenAI(apiKey);
    if (!openai) {
      return res.status(400).json({ error: "OpenAI API key required" });
    }

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size || "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image generated");
      }

      res.json({
        imageUrl,
        prompt,
        model: "dall-e-3",
        size: size || "1024x1024",
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({
        error: "Image generation failed",
        details: error.message,
      });
    }
  });

  // ======================================================
  // ZIP CODE - Download Code as ZIP
  // ======================================================
  app.post("/api/zip-code", (req, res) => {
    const { code, filename } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    try {
      const safeName = (filename || "main.js").replace(/[^\w.\-]/g, "");
      const zip = new AdmZip();
      zip.addFile(safeName, Buffer.from(code, "utf-8"));

      const buffer = zip.toBuffer();

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="vipudevai-code.zip"`,
      });

      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create ZIP" });
    }
  });

  // ======================================================
  // ANALYZE ZIP - AI Code Review
  // ======================================================
  app.post("/api/analyze-zip", upload.single("file"), async (req: MulterRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const apiKey = req.body.apiKey;
    const openai = getOpenAI(apiKey);

    if (!openai) {
      return res.status(400).json({ error: "OpenAI API key required" });
    }

    try {
      const zip = new AdmZip(req.file.path);
      const entries = zip.getEntries();

      let codeContent = "";
      const supportedExts = [".js", ".ts", ".tsx", ".jsx", ".py", ".json", ".css", ".html", ".md"];

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        const ext = path.extname(entry.entryName).toLowerCase();
        if (supportedExts.includes(ext)) {
          const content = entry.getData().toString("utf-8");
          codeContent += `\n\n=== ${entry.entryName} ===\n${content.slice(0, 2000)}`;
        }
      }

      if (!codeContent) {
        return res.status(400).json({ error: "No code files found in ZIP" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `${VIPU_SYSTEM_PROMPT}\n\nYou are reviewing a codebase. Provide:
1. Overview of what the code does
2. Code quality assessment (1-10)
3. Security issues if any
4. Performance suggestions
5. Best practices recommendations`,
          },
          {
            role: "user",
            content: `Please analyze this codebase:\n${codeContent.slice(0, 15000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      // Cleanup uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch {}

      res.json({
        analysis: completion.choices[0]?.message?.content || "",
        filesAnalyzed: entries.filter((e) => !e.isDirectory).length,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Analysis failed", details: error.message });
    }
  });

  // ======================================================
  // WEB SEARCH - Perplexity-style Real-time Search
  // ======================================================
  app.post("/api/search", async (req, res) => {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    try {
      const results = await searchWeb(query);
      res.json({ results, query });
    } catch (error: any) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // ======================================================
  // APP BUILDER - Generative Developer Agent
  // Builds complete full-stack applications
  // ======================================================
  app.post("/api/build", async (req, res) => {
    const { prompt, techStack, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Project description is required" });
    }

    const openai = getOpenAI(apiKey);
    if (!openai) {
      return res.status(400).json({
        error: "OpenAI API key required",
        hint: "Please add your OpenAI API key",
      });
    }

    try {
      const techStackInfo = techStack ? `\n\nUSER REQUESTED TECH STACK: ${techStack}` : "";
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: VIPU_BUILDER_PROMPT + techStackInfo,
          },
          {
            role: "user",
            content: `Build me: ${prompt}\n\nGenerate ALL files for a complete, production-ready application. Start immediately with the file outputs.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 16384, // Maximum output for complex apps
      });

      const rawResponse = completion.choices[0]?.message?.content || "";
      
      // Parse the response into files
      const files = parseFilesFromResponse(rawResponse);

      res.json({
        rawResponse,
        files,
        fileCount: files.length,
        model: "gpt-4o",
        prompt,
      });
    } catch (error: any) {
      console.error("Build error:", error);
      res.status(500).json({
        error: "Build failed",
        details: error.message,
      });
    }
  });

  // ======================================================
  // DOWNLOAD PROJECT - Create ZIP from generated files
  // ======================================================
  app.post("/api/download-project", (req, res) => {
    const { files, projectName } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Files are required" });
    }

    try {
      const zip = new AdmZip();
      const safeName = (projectName || "vipudev-project").replace(/[^\w\-]/g, "-");

      for (const file of files) {
        if (file.path && file.content) {
          // Ensure proper path within ZIP (remove leading slashes)
          const filePath = file.path.replace(/^\/+/, "");
          zip.addFile(filePath, Buffer.from(file.content, "utf-8"));
        }
      }

      const buffer = zip.toBuffer();

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName}.zip"`,
      });

      res.send(buffer);
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to create ZIP" });
    }
  });

  return httpServer;
}

// ========================================================
// FILE PARSER - Extract files from AI response
// ========================================================
function parseFilesFromResponse(response: string): { path: string; content: string; language: string }[] {
  const files: { path: string; content: string; language: string }[] = [];
  
  // Pattern to match: FILE: path\n```language\ncontent\n```
  const filePattern = /FILE:\s*([^\n]+)\n```(\w*)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = filePattern.exec(response)) !== null) {
    const filePath = match[1].trim();
    const language = match[2] || detectLanguage(filePath);
    const content = match[3].trim();
    
    if (filePath && content) {
      files.push({
        path: filePath,
        content,
        language,
      });
    }
  }

  // If no FILE: pattern found, try alternative patterns
  if (files.length === 0) {
    // Try: ### filename or ## filename followed by code block
    const altPattern = /(?:#{2,3}|####)\s*`?([^`\n]+)`?\n```(\w*)\n([\s\S]*?)```/g;
    while ((match = altPattern.exec(response)) !== null) {
      const filePath = match[1].trim();
      const language = match[2] || detectLanguage(filePath);
      const content = match[3].trim();
      
      if (filePath && content && filePath.includes(".")) {
        files.push({
          path: filePath,
          content,
          language,
        });
      }
    }
  }

  return files;
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".py": "python",
    ".json": "json",
    ".html": "html",
    ".css": "css",
    ".md": "markdown",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".sql": "sql",
    ".env": "plaintext",
    ".gitignore": "plaintext",
  };
  return langMap[ext] || "plaintext";
}
