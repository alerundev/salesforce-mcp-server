#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools/index.js';

// Auth helpers
const REQUIRED_TOKEN = process.env['TOKEN'];
const isAuthEnabled = () => !!REQUIRED_TOKEN;

const validateToken = (token?: string): boolean => {
  if (!isAuthEnabled()) return true;
  if (!token) return false;
  return token === REQUIRED_TOKEN;
};

const extractBearerToken = (authHeader?: string): string | undefined => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  return authHeader.substring(7);
};

// Create MCP server
const createMcpServer = () => {
  const server = new McpServer(
    { name: 'Salesforce MCP Server', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  if (tools?.length) {
    for (const tool of tools) {
      server.tool(
        tool.name,
        tool.description,
        tool.args || {},
        tool.handle as () => Promise<CallToolResult>
      );
    }
  }

  return server;
};

const MCP_PORT = process.env['MCP_PORT'] ? parseInt(process.env['MCP_PORT'], 10) : 3000;
const app = express();

app.use(express.json());
app.use(cors({ origin: '*', exposedHeaders: ['Mcp-Session-Id'] }));

// Auth middleware
app.use((req, res, next) => {
  if (!isAuthEnabled()) return next();

  const token = extractBearerToken(req.headers.authorization);
  if (!validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid Bearer token required' });
  }
  next();
});

// Session transport map
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// POST /mcp
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (sid: string) => {
          console.log(`Session initialized: ${sid}`);
          transports[sid] = transport;
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Session closed: ${sid}`);
          delete transports[sid];
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null,
      });
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// GET /mcp - SSE stream
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).send('Invalid or missing session ID');
  }
  await transports[sessionId]!.handleRequest(req, res);
});

// DELETE /mcp - session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).send('Invalid or missing session ID');
  }
  try {
    await transports[sessionId]!.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) res.status(500).send('Error processing session termination');
  }
});

// Start
const host = process.env['HOST'] || '0.0.0.0';
app.listen(MCP_PORT, host, () => {
  console.log(`🚀 Salesforce MCP Server running on http://${host}:${MCP_PORT}`);
  console.log(`🔐 Authentication: ${isAuthEnabled() ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔗 Salesforce: ${process.env['SF_USERNAME'] || '(not configured)'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  for (const sid in transports) {
    try {
      await transports[sid]?.close();
      delete transports[sid];
    } catch (e) {
      console.error(`Error closing session ${sid}:`, e);
    }
  }
  process.exit(0);
});
