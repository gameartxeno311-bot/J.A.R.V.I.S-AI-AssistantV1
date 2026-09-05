export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MemoryType = 'profile' | 'fact' | 'episodic' | 'task' | 'preference' | 'project' | 'procedural';
export type MemoryScope = 'global' | 'user' | 'project' | 'conversation' | 'temporary';

export interface AssistantConfig {
  assistantName: string;
  userName?: string;
  preferredFormOfAddress?: string;
  personalityMode: string;
  verbosity: 'concise' | 'balanced' | 'detailed';
  humorLevel: number;
  proactivityLevel: number;
  confirmationPolicy: 'safe-default' | 'confirm-high-risk' | 'confirm-all-actions';
  timezone: string;
  privacyMode: boolean;
  voiceEnabled: boolean;
  voiceName: string;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  voiceLanguage: string;
  voiceAutoPlay: boolean;
  voiceStyle: string;
  voiceInstructions: string;
  speechProvider: 'browser' | 'groq' | 'openai';
  groqTtsVoice?: string;
  groqTtsModel?: string;
  openaiTtsVoice?: string;
  openaiTtsModel?: string;
  customVoiceFileName?: string;
  customVoiceUrl?: string;
  groqApiKey?: string;
  groqModel?: string;
  llmAdapterEnabled: boolean;
  llmAdapterName: string;
  llmAdapterFileName: string;
  notificationsEnabled: boolean;
  soundEffectsEnabled: boolean;
  theme: 'red' | 'amber' | 'cyan' | 'green';
}

export interface EventEnvelope { type: string; timestamp: string; source: string; content: unknown; metadata?: Record<string, unknown>; }
export interface ToolContext { userId: string; conversationId?: string; requestId: string; }
export interface ToolDefinition<T = unknown, R = unknown> { name:string; description:string; riskLevel:RiskLevel; requiresConfirmation:boolean; timeoutMs:number; validate(input:unknown):T; execute(input:T,context:ToolContext):Promise<R>; }
export interface PlanStep { id:string; description:string; tool?:string; input?:unknown; status:'pending'|'running'|'completed'|'failed'|'cancelled'; }
export interface AgentPlan { goal:string; steps:PlanStep[]; }
export interface LLMProvider { generate(input:{system:string;messages:Array<{role:string;content:string}>}):Promise<string>; structuredOutput<T>(input:{system:string;messages:Array<{role:string;content:string}>;schema:unknown}):Promise<T>; healthCheck():Promise<boolean>; }
