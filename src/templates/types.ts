/**
 * Types for prompt templates
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  content: string;
  variables?: TemplateVariable[];
  isBuiltIn: boolean;
}

export type TemplateCategory =
  | 'code'
  | 'documentation'
  | 'debugging'
  | 'testing'
  | 'refactoring'
  | 'explanation'
  | 'review'
  | 'general';

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
}
