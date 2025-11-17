/**
 * HTTP Sync Server for Browser Extension Communication
 * Runs on localhost to enable real-time bidirectional sync
 */

import * as http from 'http';
import * as vscode from 'vscode';
import { ProfileManager } from './manager';
import { SyncStatusBarManager } from '../ui/syncStatusBar';

export class ProfileSyncServer {
  private server: http.Server | null = null;
  private clients: http.ServerResponse[] = [];
  private port: number;
  private profileManager: ProfileManager;
  private statusBarManager: SyncStatusBarManager | undefined;
  private isRunning: boolean = false;

  constructor(profileManager: ProfileManager, port: number = 8765) {
    this.profileManager = profileManager;
    this.port = port;
  }

  /**
   * Set the status bar manager for sync status updates
   */
  setStatusBarManager(statusBarManager: SyncStatusBarManager): void {
    this.statusBarManager = statusBarManager;
  }

  /**
   * Start the sync server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          vscode.window.showWarningMessage(
            `Promptiply sync server port ${this.port} is already in use. Sync disabled.`
          );
        } else {
          vscode.window.showErrorMessage(
            `Promptiply sync server error: ${error.message}`
          );
        }
        this.statusBarManager?.setError('Server failed to start');
        reject(error);
      });

      this.server.listen(this.port, 'localhost', () => {
        this.isRunning = true;
        console.log(`Promptiply sync server running on http://localhost:${this.port}`);
        this.statusBarManager?.setSynced();
        resolve();
      });
    });
  }

  /**
   * Stop the sync server
   */
  async stop(): Promise<void> {
    if (!this.server || !this.isRunning) {
      return;
    }

    // Close all SSE connections
    this.clients.forEach(client => client.end());
    this.clients = [];

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        this.server = null;
        console.log('Promptiply sync server stopped');
        resolve();
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    // CORS headers for browser extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // GET /health - Health check
      if (req.method === 'GET' && req.url === '/health') {
        this.handleHealth(res);
      }
      // GET /profiles - Get all profiles
      else if (req.method === 'GET' && req.url === '/profiles') {
        await this.handleGetProfiles(res);
      }
      // POST /profiles - Update profiles
      else if (req.method === 'POST' && req.url === '/profiles') {
        await this.handleUpdateProfiles(req, res);
      }
      // GET /sync - Server-Sent Events for real-time updates
      else if (req.method === 'GET' && req.url === '/sync') {
        this.handleSSE(req, res);
      }
      // 404
      else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error: any) {
      console.error('Sync server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Health check endpoint
   */
  private handleHealth(res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      service: 'promptiply-sync'
    }));
  }

  /**
   * Get profiles endpoint
   */
  private async handleGetProfiles(res: http.ServerResponse): Promise<void> {
    const profiles = await this.profileManager.getProfiles();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(profiles));
  }

  /**
   * Update profiles endpoint
   */
  private async handleUpdateProfiles(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        this.statusBarManager?.setSyncing();

        const profiles = JSON.parse(body);

        // Validate profiles structure
        if (!profiles || !Array.isArray(profiles.list)) {
          throw new Error('Invalid profiles format');
        }

        // Save profiles
        await this.profileManager.saveProfiles(profiles);

        // Notify all connected SSE clients
        this.broadcast({
          type: 'profiles_updated',
          profiles,
          source: 'browser',
          timestamp: Date.now()
        });

        this.statusBarManager?.setSynced();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          profileCount: profiles.list.length
        }));
      } catch (error: any) {
        this.statusBarManager?.setError('Failed to update profiles');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  /**
   * Server-Sent Events endpoint for real-time updates
   */
  private handleSSE(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Connected to Promptiply sync server',
      timestamp: Date.now()
    })}\n\n`);

    // Add client to list
    this.clients.push(res);

    // Remove client on disconnect
    req.on('close', () => {
      this.clients = this.clients.filter(client => client !== res);
      console.log(`SSE client disconnected. Active clients: ${this.clients.length}`);
    });

    console.log(`SSE client connected. Active clients: ${this.clients.length}`);
  }

  /**
   * Broadcast message to all connected SSE clients
   */
  broadcast(data: any): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    let sent = 0;

    this.clients.forEach((client) => {
      try {
        client.write(message);
        sent++;
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    });

    if (sent > 0) {
      console.log(`Broadcast to ${sent} client(s):`, data.type);
    }
  }

  /**
   * Notify browser extension of profile changes from VSCode
   */
  async notifyProfilesChanged(): Promise<void> {
    const profiles = await this.profileManager.getProfiles();
    this.broadcast({
      type: 'profiles_updated',
      profiles,
      source: 'vscode',
      timestamp: Date.now()
    });
  }

  /**
   * Get server info
   */
  getServerInfo(): { running: boolean; port: number; clients: number } {
    return {
      running: this.isRunning,
      port: this.port,
      clients: this.clients.length
    };
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
