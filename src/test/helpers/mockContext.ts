/**
 * Mock VSCode Extension Context for testing
 */

import * as vscode from 'vscode';

export class MockMemento implements vscode.Memento {
    private storage = new Map<string, any>();

    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }

    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string, defaultValue?: T): T | undefined {
        const value = this.storage.get(key);
        return value !== undefined ? value : defaultValue;
    }

    async update(key: string, value: any): Promise<void> {
        this.storage.set(key, value);
    }

    setKeysForSync(keys: readonly string[]): void {
        // Not implemented for mock
    }
}

export class MockSecretStorage implements vscode.SecretStorage {
    private storage = new Map<string, string>();
    private _onDidChange = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>();

    get onDidChange(): vscode.Event<vscode.SecretStorageChangeEvent> {
        return this._onDidChange.event;
    }

    async keys(): Promise<string[]> {
        return Array.from(this.storage.keys());
    }

    async get(key: string): Promise<string | undefined> {
        return this.storage.get(key);
    }

    async store(key: string, value: string): Promise<void> {
        this.storage.set(key, value);
        this._onDidChange.fire({ key });
    }

    async delete(key: string): Promise<void> {
        this.storage.delete(key);
        this._onDidChange.fire({ key });
    }
}

export function createMockContext(): vscode.ExtensionContext {
    const globalState = new MockMemento();
    const workspaceState = new MockMemento();
    const secrets = new MockSecretStorage();

    return {
        subscriptions: [],
        workspaceState,
        globalState,
        secrets,
        extensionUri: vscode.Uri.file('/mock/extension/path'),
        extensionPath: '/mock/extension/path',
        asAbsolutePath: (relativePath: string) => `/mock/extension/path/${relativePath}`,
        storagePath: '/mock/storage',
        globalStoragePath: '/mock/global/storage',
        logPath: '/mock/log',
        extensionMode: vscode.ExtensionMode.Test,
        storageUri: vscode.Uri.file('/mock/storage'),
        globalStorageUri: vscode.Uri.file('/mock/global/storage'),
        logUri: vscode.Uri.file('/mock/log'),
        extension: {} as vscode.Extension<any>,
        environmentVariableCollection: {} as any,
        languageModelAccessInformation: {} as any,
    } as vscode.ExtensionContext;
}
