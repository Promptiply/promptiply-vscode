import * as vscode from 'vscode';

/**
 * Centralized logging utility for Promptiply extension
 */
class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;

  /**
   * Initialize the logger with an output channel
   */
  static initialize() {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Promptiply');
    }
  }

  /**
   * Get the output channel instance
   */
  static getChannel(): vscode.OutputChannel {
    if (!this.outputChannel) {
      this.initialize();
    }
    return this.outputChannel!;
  }

  /**
   * Log an info message
   */
  static info(message: string) {
    const timestamp = new Date().toISOString();
    this.getChannel().appendLine(`[${timestamp}] [INFO] ${message}`);
  }

  /**
   * Log a warning message
   */
  static warn(message: string) {
    const timestamp = new Date().toISOString();
    this.getChannel().appendLine(`[${timestamp}] [WARN] ${message}`);
  }

  /**
   * Log an error message
   */
  static error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    this.getChannel().appendLine(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      this.getChannel().appendLine(`  ${error.stack || error.message || error}`);
    }
  }

  /**
   * Log a debug message
   */
  static debug(message: string) {
    const timestamp = new Date().toISOString();
    this.getChannel().appendLine(`[${timestamp}] [DEBUG] ${message}`);
  }

  /**
   * Show the output channel
   */
  static show() {
    this.getChannel().show();
  }

  /**
   * Dispose the output channel
   */
  static dispose() {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }
}

export default Logger;
