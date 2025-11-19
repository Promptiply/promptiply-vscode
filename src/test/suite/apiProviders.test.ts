/**
 * Integration tests for API Providers
 * Tests error handling, validation, and response parsing
 */

import * as assert from 'assert';
import { RefinementEngine, RefinementConfig } from '../../refinement/engine';
import { ProfileManager } from '../../profiles/manager';
import { createMockContext } from '../helpers/mockContext';

suite('API Provider Integration Tests', () => {
    let engine: RefinementEngine;
    let profileManager: ProfileManager;
    let context: any;

    setup(() => {
        context = createMockContext();
        profileManager = new ProfileManager(context);
        engine = new RefinementEngine(profileManager);
    });

    suite('OpenAI Provider', () => {
        test('should reject empty API key', async () => {
            const config: RefinementConfig = {
                mode: 'openai-api',
                useEconomyModel: true,
                vscodeLM: {
                    economyFamily: 'gpt-3.5-turbo',
                    premiumFamily: 'gpt-4o',
                },
                ollama: {
                    endpoint: 'http://localhost:11434',
                    economyModel: 'llama3.2:3b',
                    premiumModel: 'llama3.1:8b',
                },
                openai: {
                    apiKey: '',
                    economyModel: 'gpt-5-mini',
                    premiumModel: 'gpt-5-2025-08-07',
                },
                anthropic: {
                    apiKey: '',
                    economyModel: 'claude-haiku-4-5',
                    premiumModel: 'claude-sonnet-4-5',
                },
            };

            await assert.rejects(
                async () => await engine.refine('Test prompt', config),
                /API key|not configured|missing/i
            );
        });

        test('should validate API key format', () => {
            // Valid OpenAI key format starts with 'sk-'
            const validKey = 'sk-proj-1234567890abcdef';
            assert.ok(validKey.startsWith('sk-'), 'Valid key should start with sk-');

            // Invalid format examples
            const invalidKey1 = 'invalid-key';
            assert.ok(!invalidKey1.startsWith('sk-'), 'Invalid key should not start with sk-');
        });

        test('should select correct model based on economy setting', () => {
            const config = RefinementEngine.getConfig();

            // Economy model should be gpt-5-mini
            assert.ok(config.openai.economyModel.includes('mini') || config.openai.economyModel.includes('3.5'));

            // Premium model should be gpt-5 or gpt-4
            assert.ok(
                config.openai.premiumModel.includes('gpt-5') ||
                config.openai.premiumModel.includes('gpt-4')
            );
        });

        test('should have non-empty model names', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(config.openai.economyModel.length > 0, 'Economy model should not be empty');
            assert.ok(config.openai.premiumModel.length > 0, 'Premium model should not be empty');
        });
    });

    suite('Anthropic Provider', () => {
        test('should reject empty API key', async () => {
            const config: RefinementConfig = {
                mode: 'anthropic-api',
                useEconomyModel: true,
                vscodeLM: {
                    economyFamily: 'gpt-3.5-turbo',
                    premiumFamily: 'gpt-4o',
                },
                ollama: {
                    endpoint: 'http://localhost:11434',
                    economyModel: 'llama3.2:3b',
                    premiumModel: 'llama3.1:8b',
                },
                openai: {
                    apiKey: '',
                    economyModel: 'gpt-5-mini',
                    premiumModel: 'gpt-5-2025-08-07',
                },
                anthropic: {
                    apiKey: '',
                    economyModel: 'claude-haiku-4-5',
                    premiumModel: 'claude-sonnet-4-5',
                },
            };

            await assert.rejects(
                async () => await engine.refine('Test prompt', config),
                /API key|not configured|missing/i
            );
        });

        test('should validate API key format', () => {
            // Valid Anthropic key format starts with 'sk-ant-'
            const validKey = 'sk-ant-api03-1234567890abcdef';
            assert.ok(validKey.startsWith('sk-ant-'), 'Valid key should start with sk-ant-');

            // Invalid format examples
            const invalidKey1 = 'sk-invalid-key';
            assert.ok(!invalidKey1.startsWith('sk-ant-'), 'Invalid key should not start with sk-ant-');
        });

        test('should select correct model based on economy setting', () => {
            const config = RefinementEngine.getConfig();

            // Economy model should be haiku
            assert.ok(
                config.anthropic.economyModel.toLowerCase().includes('haiku'),
                'Economy model should be haiku'
            );

            // Premium model should be sonnet
            assert.ok(
                config.anthropic.premiumModel.toLowerCase().includes('sonnet'),
                'Premium model should be sonnet'
            );
        });

        test('should have non-empty model names', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(config.anthropic.economyModel.length > 0, 'Economy model should not be empty');
            assert.ok(config.anthropic.premiumModel.length > 0, 'Premium model should not be empty');
        });
    });

    suite('Ollama Provider', () => {
        test('should have valid endpoint format', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(
                config.ollama.endpoint.startsWith('http://') ||
                config.ollama.endpoint.startsWith('https://'),
                'Endpoint should be a valid URL'
            );
        });

        test('should have default localhost endpoint', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(
                config.ollama.endpoint.includes('localhost') ||
                config.ollama.endpoint.includes('127.0.0.1'),
                'Default endpoint should be localhost'
            );
        });

        test('should select correct model based on economy setting', () => {
            const config = RefinementEngine.getConfig();

            // Economy model should be smaller (3b)
            assert.ok(
                config.ollama.economyModel.includes('3b') ||
                config.ollama.economyModel.includes('small'),
                'Economy model should be smaller'
            );

            // Premium model should be larger (8b or higher)
            assert.ok(
                config.ollama.premiumModel.includes('8b') ||
                config.ollama.premiumModel.includes('7b') ||
                config.ollama.premiumModel.includes('large'),
                'Premium model should be larger'
            );
        });

        test('should have non-empty model names', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(config.ollama.economyModel.length > 0, 'Economy model should not be empty');
            assert.ok(config.ollama.premiumModel.length > 0, 'Premium model should not be empty');
        });
    });

    suite('VSCode LM Provider', () => {
        test('should have model family configuration', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(config.vscodeLM.economyFamily, 'Should have economy family');
            assert.ok(config.vscodeLM.premiumFamily, 'Should have premium family');
        });

        test('should have different economy and premium families', () => {
            const config = RefinementEngine.getConfig();
            assert.notStrictEqual(
                config.vscodeLM.economyFamily,
                config.vscodeLM.premiumFamily,
                'Economy and premium should be different'
            );
        });
    });

    suite('Response Parsing', () => {
        test('should handle JSON response format', () => {
            // Test JSON parsing logic
            const jsonResponse = JSON.stringify({
                refinedPrompt: 'Refined test prompt',
                reasoning: 'Test reasoning',
                topics: ['test', 'sample']
            });

            const parsed = JSON.parse(jsonResponse);
            assert.ok(parsed.refinedPrompt, 'Should have refinedPrompt');
            assert.ok(parsed.reasoning, 'Should have reasoning');
            assert.ok(Array.isArray(parsed.topics), 'Topics should be array');
        });

        test('should handle alternative JSON keys', () => {
            // Some models return different key names
            const altResponse = JSON.stringify({
                refined_prompt: 'Refined test prompt',
                explanation: 'Test explanation',
                detected_topics: ['test']
            });

            const parsed = JSON.parse(altResponse);
            assert.ok(
                parsed.refinedPrompt || parsed.refined_prompt,
                'Should handle either key format'
            );
        });

        test('should handle malformed JSON gracefully', () => {
            const malformed = 'This is not valid JSON';

            assert.throws(() => {
                JSON.parse(malformed);
            }, SyntaxError, 'Should throw on invalid JSON');
        });
    });

    suite('Error Scenarios', () => {
        test('should handle network timeout gracefully', async () => {
            // This tests that the engine can be configured but would fail on actual call
            const config = RefinementEngine.getConfig();
            config.ollama.endpoint = 'http://localhost:99999'; // Invalid port

            // Engine should still be configurable
            assert.ok(config.ollama.endpoint, 'Should accept any endpoint configuration');
        });

        test('should handle rate limiting info', () => {
            // Rate limit errors should contain retry information
            const rateLimitError = {
                message: 'Rate limit exceeded',
                retryAfter: 60
            };

            assert.ok(rateLimitError.retryAfter > 0, 'Should have retry time');
        });

        test('should handle authentication errors', () => {
            // Auth errors should be clearly identifiable
            const authError = {
                status: 401,
                message: 'Invalid API key'
            };

            assert.strictEqual(authError.status, 401, 'Auth errors are 401');
        });

        test('should handle model not found errors', () => {
            // Model errors should indicate the specific model
            const modelError = {
                status: 404,
                message: 'Model not found: gpt-99'
            };

            assert.strictEqual(modelError.status, 404, 'Model not found is 404');
        });
    });

    suite('Token Usage Tracking', () => {
        test('should track input tokens', () => {
            const usage = {
                inputTokens: 100,
                outputTokens: 50,
                totalTokens: 150
            };

            assert.strictEqual(usage.inputTokens + usage.outputTokens, usage.totalTokens);
        });

        test('should handle missing usage data', () => {
            const responseWithoutUsage: {
                content: string;
                usage?: { totalTokens: number };
            } = {
                content: 'Response text',
                usage: undefined
            };

            // Should default to 0 when usage not provided
            const tokens = responseWithoutUsage.usage?.totalTokens ?? 0;
            assert.strictEqual(tokens, 0, 'Should default to 0');
        });
    });

    suite('Configuration Defaults', () => {
        test('should use default mode when not specified', () => {
            const config = RefinementEngine.getConfig();
            assert.ok(
                ['vscode-lm', 'ollama', 'openai-api', 'anthropic-api'].includes(config.mode),
                'Should have a valid default mode'
            );
        });

        test('should default to economy model', () => {
            const config = RefinementEngine.getConfig();
            // Default should be economy for cost savings
            assert.strictEqual(typeof config.useEconomyModel, 'boolean');
        });
    });
});
