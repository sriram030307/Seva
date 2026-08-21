import { Conversation } from '@11labs/client';

export interface ElevenLabsStatus {
  isAvailable: boolean;
  agentId?: string;
  hasApiKey: boolean;
  isSignedSessionActive: boolean;
  error?: string;
}

export class ElevenLabsService {
  private conversation: any = null;
  private agentId: string = (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID || '';
  private apiKey: string = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY || '';

  public getStatus(): ElevenLabsStatus {
    const hasAgent = Boolean(this.agentId && this.agentId.trim().length > 0);
    const hasKey = Boolean(this.apiKey && this.apiKey.trim().length > 0);
    return {
      isAvailable: hasAgent,
      agentId: this.agentId || 'seva-tamil-english-voice-agent-demo',
      hasApiKey: hasKey,
      isSignedSessionActive: false
    };
  }

  /**
   * Starts a real ElevenLabs Conversational Session with SEVA Agent
   */
  public async startConversation(options: {
    agentId?: string;
    onMessage?: (message: { source: 'user' | 'ai'; message: string }) => void;
    onError?: (error: any) => void;
    onStatusChange?: (status: { status: string }) => void;
    onModeChange?: (mode: { mode: 'speaking' | 'listening' }) => void;
  }): Promise<boolean> {
    const targetAgentId = options.agentId || this.agentId;

    if (!targetAgentId) {
      console.info('ElevenLabs Agent ID not configured in environment. Using integrated SEVA Multilingual Voice Engine.');
      return false;
    }

    try {
      // Request mic permission first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const sessionConfig: any = {
        agentId: targetAgentId,
        onMessage: options.onMessage,
        onError: options.onError,
        onStatusChange: options.onStatusChange,
        onModeChange: options.onModeChange
      };

      this.conversation = await (Conversation as any).startSession(sessionConfig);

      return true;
    } catch (err: any) {
      console.warn('ElevenLabs session start error, switching seamlessly to SEVA native voice engine:', err);
      if (options.onError) {
        options.onError(err);
      }
      return false;
    }
  }

  public async endConversation(): Promise<void> {
    try {
      if (this.conversation) {
        await this.conversation.endSession();
        this.conversation = null;
      }
    } catch (e) {
      console.error('Error ending ElevenLabs session:', e);
    }
  }

  public isSessionActive(): boolean {
    return Boolean(this.conversation);
  }
}

export const elevenLabsService = new ElevenLabsService();
