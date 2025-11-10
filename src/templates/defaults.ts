/**
 * Built-in prompt templates
 */

import { Template } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  // Code generation templates
  {
    id: 'code-function',
    name: 'Create Function',
    description: 'Generate a well-documented function',
    category: 'code',
    isBuiltIn: true,
    content: `Create a {{language}} function that {{functionality}}.

Requirements:
• Input parameters: {{parameters}}
• Return value: {{returnValue}}
• Handle edge cases (null, empty, invalid input)
• Include comprehensive error handling
• Add JSDoc/docstring comments
• Follow {{language}} best practices and conventions
• Make it type-safe and reusable

Include example usage demonstrating different scenarios.`,
    variables: [
      { name: 'language', description: 'Programming language', defaultValue: 'TypeScript' },
      { name: 'functionality', description: 'What the function should do' },
      { name: 'parameters', description: 'Expected input parameters' },
      { name: 'returnValue', description: 'What it should return' },
    ],
  },
  {
    id: 'code-class',
    name: 'Create Class',
    description: 'Generate a class with methods and properties',
    category: 'code',
    isBuiltIn: true,
    content: `Create a {{language}} class named {{className}} that {{purpose}}.

Requirements:
• Properties: {{properties}}
• Methods: {{methods}}
• Use appropriate access modifiers (private, public, protected)
• Implement proper encapsulation
• Add comprehensive documentation
• Include constructor with parameter validation
• Follow SOLID principles
• Make it extensible and maintainable

Include example usage showing how to instantiate and use the class.`,
    variables: [
      { name: 'language', description: 'Programming language', defaultValue: 'TypeScript' },
      { name: 'className', description: 'Name of the class' },
      { name: 'purpose', description: 'What the class represents' },
      { name: 'properties', description: 'Class properties/fields' },
      { name: 'methods', description: 'Class methods' },
    ],
  },
  {
    id: 'code-api-endpoint',
    name: 'Create API Endpoint',
    description: 'Generate a REST API endpoint',
    category: 'code',
    isBuiltIn: true,
    content: `Create a REST API endpoint for {{operation}}.

Details:
• HTTP Method: {{method}}
• Path: {{path}}
• Framework: {{framework}}
• Request body/parameters: {{requestParams}}
• Response format: {{responseFormat}}

Requirements:
• Implement proper validation for inputs
• Add authentication/authorization if needed
• Handle errors gracefully with appropriate HTTP status codes
• Include request/response examples
• Add OpenAPI/Swagger documentation
• Follow RESTful conventions
• Implement rate limiting considerations
• Add logging for debugging

Include test cases covering success and error scenarios.`,
    variables: [
      { name: 'operation', description: 'What the endpoint does' },
      { name: 'method', description: 'HTTP method', defaultValue: 'POST' },
      { name: 'path', description: 'API path', defaultValue: '/api/' },
      { name: 'framework', description: 'Framework', defaultValue: 'Express.js' },
      { name: 'requestParams', description: 'Request parameters' },
      { name: 'responseFormat', description: 'Response structure' },
    ],
  },

  // Documentation templates
  {
    id: 'doc-readme',
    name: 'README Documentation',
    description: 'Create comprehensive README',
    category: 'documentation',
    isBuiltIn: true,
    content: `Create a comprehensive README.md for {{projectName}}.

Project description: {{description}}

Include the following sections:
• Clear project title and description
• Features and capabilities
• Installation instructions
• Quick start guide with examples
• Configuration options
• Usage examples with code snippets
• API documentation (if applicable)
• Contributing guidelines
• License information
• Troubleshooting section
• Links to additional resources

Use proper markdown formatting with badges, code blocks, and organized sections.
Make it beginner-friendly while being comprehensive.`,
    variables: [
      { name: 'projectName', description: 'Name of the project' },
      { name: 'description', description: 'Brief project description' },
    ],
  },
  {
    id: 'doc-api',
    name: 'API Documentation',
    description: 'Document API endpoints and usage',
    category: 'documentation',
    isBuiltIn: true,
    content: `Create API documentation for {{apiName}}.

Endpoint: {{endpoint}}

Include:
• Endpoint description and purpose
• HTTP method and full URL
• Authentication requirements
• Request parameters (path, query, body) with types and descriptions
• Request headers
• Request body schema with example JSON
• Response codes and their meanings
• Response body schema with example JSON
• Error responses with codes and messages
• Rate limiting information
• Example cURL requests
• Example responses (success and error)
• Code examples in multiple languages (JavaScript, Python, etc.)

Make it clear, concise, and developer-friendly.`,
    variables: [
      { name: 'apiName', description: 'Name of the API' },
      { name: 'endpoint', description: 'API endpoint path' },
    ],
  },

  // Debugging templates
  {
    id: 'debug-analyze',
    name: 'Debug Error',
    description: 'Analyze and fix errors',
    category: 'debugging',
    isBuiltIn: true,
    content: `Help me debug this error in {{language}}.

Error message: {{errorMessage}}

Context: {{context}}

Please:
• Explain what the error means in simple terms
• Identify the root cause
• Suggest 2-3 possible solutions with code examples
• Explain why each solution works
• Recommend the best approach and why
• Suggest how to prevent similar errors in the future
• Include debugging steps to verify the fix

Provide clear explanations and working code examples.`,
    variables: [
      { name: 'language', description: 'Programming language', defaultValue: 'JavaScript' },
      { name: 'errorMessage', description: 'The error message' },
      { name: 'context', description: 'Code context or what you were doing' },
    ],
  },

  // Testing templates
  {
    id: 'test-unit',
    name: 'Unit Tests',
    description: 'Generate comprehensive unit tests',
    category: 'testing',
    isBuiltIn: true,
    content: `Create comprehensive unit tests for {{codeDescription}}.

Testing framework: {{framework}}

Requirements:
• Test all public methods/functions
• Cover edge cases and boundary conditions
• Test error handling and exceptions
• Test with valid and invalid inputs
• Include setup and teardown if needed
• Use descriptive test names following conventions
• Add comments explaining complex test scenarios
• Aim for high code coverage (>80%)
• Mock external dependencies appropriately
• Test both success and failure paths

Organize tests logically with proper describe/test blocks.`,
    variables: [
      { name: 'codeDescription', description: 'What code to test' },
      { name: 'framework', description: 'Testing framework', defaultValue: 'Jest' },
    ],
  },

  // Refactoring templates
  {
    id: 'refactor-improve',
    name: 'Refactor Code',
    description: 'Improve code quality and structure',
    category: 'refactoring',
    isBuiltIn: true,
    content: `Refactor this {{language}} code to improve its quality: {{codeSnippet}}

Focus on:
• Readability and maintainability
• Performance optimization
• Following SOLID principles
• Removing code duplication (DRY)
• Proper naming conventions
• Separating concerns
• Adding type safety
• Error handling improvements
• Making it more testable

Provide:
• The refactored code with explanations
• Specific improvements made
• Why each change improves the code
• Any potential trade-offs
• Suggestions for further improvements`,
    variables: [
      { name: 'language', description: 'Programming language', defaultValue: 'JavaScript' },
      { name: 'codeSnippet', description: 'Code to refactor (or describe it)' },
    ],
  },

  // Explanation templates
  {
    id: 'explain-concept',
    name: 'Explain Concept',
    description: 'Get clear explanation of technical concepts',
    category: 'explanation',
    isBuiltIn: true,
    content: `Explain {{concept}} in {{language}} or {{technology}}.

Target audience: {{audience}}

Please provide:
• Clear, simple explanation of what it is
• Why it's useful and when to use it
• How it works (step-by-step if complex)
• Code examples demonstrating the concept
• Common use cases and patterns
• Best practices and pitfalls to avoid
• Comparison to similar concepts if relevant
• Resources for learning more

Use analogies and diagrams (ASCII art) where helpful to make it easier to understand.`,
    variables: [
      { name: 'concept', description: 'Concept to explain' },
      { name: 'language', description: 'Programming language', defaultValue: 'JavaScript' },
      { name: 'technology', description: 'Technology/framework (if applicable)' },
      { name: 'audience', description: 'Experience level', defaultValue: 'intermediate developers' },
    ],
  },

  // Review templates
  {
    id: 'review-code',
    name: 'Code Review',
    description: 'Comprehensive code review',
    category: 'review',
    isBuiltIn: true,
    content: `Perform a comprehensive code review of this {{language}} code.

Review criteria:
• Code quality and readability
• Architecture and design patterns
• Performance considerations
• Security vulnerabilities
• Error handling
• Testing coverage
• Documentation completeness
• Best practices adherence
• Potential bugs or edge cases
• Maintainability and scalability

Provide:
• Strengths of the code
• Issues categorized by severity (critical, major, minor)
• Specific suggestions for improvement with code examples
• Security concerns if any
• Performance optimization opportunities
• Overall rating and recommendations`,
    variables: [
      { name: 'language', description: 'Programming language', defaultValue: 'JavaScript' },
    ],
  },

  // General templates
  {
    id: 'general-optimize',
    name: 'Optimize Performance',
    description: 'Get performance optimization suggestions',
    category: 'general',
    isBuiltIn: true,
    content: `Help me optimize the performance of {{component}}.

Current issue: {{issue}}
Technology stack: {{stack}}

Please analyze and provide:
• Identification of performance bottlenecks
• Specific optimization strategies with code examples
• Estimated performance improvement for each strategy
• Trade-offs to consider
• Tools to measure and monitor performance
• Best practices for this technology stack
• Before/after performance metrics to track

Prioritize optimizations by impact vs. effort.`,
    variables: [
      { name: 'component', description: 'What to optimize' },
      { name: 'issue', description: 'Performance issue description' },
      { name: 'stack', description: 'Technology stack' },
    ],
  },
  {
    id: 'general-architecture',
    name: 'Design Architecture',
    description: 'Get architectural design suggestions',
    category: 'general',
    isBuiltIn: true,
    content: `Design a software architecture for {{project}}.

Requirements:
• Scale: {{scale}}
• Key features: {{features}}
• Constraints: {{constraints}}

Please provide:
• High-level architecture diagram (ASCII art or description)
• Component breakdown with responsibilities
• Data flow and communication patterns
• Technology stack recommendations with justification
• Database design considerations
• API design patterns
• Scalability strategy
• Security considerations
• Deployment architecture
• Potential challenges and solutions

Focus on simplicity, maintainability, and scalability.`,
    variables: [
      { name: 'project', description: 'Project description' },
      { name: 'scale', description: 'Expected scale/users' },
      { name: 'features', description: 'Key features needed' },
      { name: 'constraints', description: 'Technical or business constraints' },
    ],
  },
];
