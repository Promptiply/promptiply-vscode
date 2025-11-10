import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('promptiply.promptiply'));
    });

    test('Extension should activate', function(done) {
        this.timeout(30000); // Increase timeout to 30s

        const ext = vscode.extensions.getExtension('promptiply.promptiply');
        assert.ok(ext, 'Extension should exist');

        if (!ext) {
            done(new Error('Extension not found'));
            return;
        }

        // Extension may already be activated
        if (ext.isActive) {
            assert.strictEqual(ext.isActive, true);
            done();
            return;
        }

        // Activate and wait
        ext.activate()
            .then(() => {
                assert.strictEqual(ext.isActive, true, 'Extension should be active after activation');
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);

        const expectedCommands = [
            'promptiply.refineSelection',
            'promptiply.switchProfile',
            'promptiply.createProfile',
            'promptiply.exportProfiles',
            'promptiply.importProfiles'
        ];

        for (const cmd of expectedCommands) {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        }
    });
});
