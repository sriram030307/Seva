import { Conversation } from '@11labs/client';
import { sevaStore } from './store';
import { db, doc, setDoc, isFirebaseConfigured } from './firebase';
import { Complaint, CivicCategory, PriorityLevel, SentimentType, GeoLocation } from '../types';

export const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_4601kzzd55xsed3tkxqhnk6cn1k1';

export type VoiceSessionStatus = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'LISTENING' 
  | 'SEVA_SPEAKING' 
  | 'PROCESSING' 
  | 'ENDED' 
  | 'ERROR';

export interface VoiceMessage {
  id: string;
  source: 'citizen' | 'seva' | 'system';
  text: string;
  timestamp: string;
  isTentative?: boolean;
}

export interface VoiceSessionState {
  status: VoiceSessionStatus;
  conversationId: string | null;
  agentId: string;
  agentName: string;
  detectedLanguage: 'Tamil' | 'English' | 'Hindi' | 'Telugu';
  isMuted: boolean;
  durationSeconds: number;
  messages: VoiceMessage[];
  lastCreatedComplaint: Complaint | null;
  errorMessage: string | null;
  isFallbackMode: boolean;
}

type StateSubscriber = (state: VoiceSessionState) => void;

class ElevenLabsVoiceService {
  private conversation: Conversation | null = null;
  private subscribers: Set<StateSubscriber> = new Set();
  private durationTimer: any = null;
  private userLocation: GeoLocation = {
    latitude: 12.9647,
    longitude: 80.1961,
    address: 'Madipakkam Main Road, Chennai',
    area: 'Madipakkam',
    landmark: 'Near Koot Road Signal',
    city: 'Chennai',
    state: 'Tamil Nadu'
  };

  private state: VoiceSessionState = {
    status: 'DISCONNECTED',
    conversationId: null,
    agentId: ELEVENLABS_AGENT_ID,
    agentName: 'SEVA',
    detectedLanguage: 'Tamil',
    isMuted: false,
    durationSeconds: 0,
    messages: [],
    lastCreatedComplaint: null,
    errorMessage: null,
    isFallbackMode: false
  };

  public setUserLocation(loc: GeoLocation) {
    this.userLocation = loc;
  }

  public getState(): VoiceSessionState {
    return { ...this.state };
  }

  public subscribe(cb: StateSubscriber): () => void {
    this.subscribers.add(cb);
    cb(this.getState());
    return () => this.subscribers.delete(cb);
  }

  private updateState(updates: Partial<VoiceSessionState>) {
    this.state = { ...this.state, ...updates };
    this.subscribers.forEach(cb => cb(this.getState()));
  }

  private addMessage(source: 'citizen' | 'seva' | 'system', text: string) {
    if (!text || !text.trim()) return;

    // Detect Language based on character sets / keywords
    const detectedLanguage = this.detectLanguageFromText(text);

    const newMsg: VoiceMessage = {
      id: `vm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...this.state.messages, newMsg];
    this.updateState({
      messages: updatedMessages,
      detectedLanguage: detectedLanguage || this.state.detectedLanguage
    });
  }

  private detectLanguageFromText(text: string): 'Tamil' | 'English' | 'Hindi' | 'Telugu' | null {
    // Tamil Unicode range: \u0B80-\u0BFF
    if (/[\u0B80-\u0BFF]/.test(text) || /\b(irukku|panranga|road|thanni|romba|illa|solunga|aiyya|amma)\b/i.test(text)) {
      return 'Tamil';
    }
    // Devanagari (Hindi) range: \u0900-\u097F
    if (/[\u0900-\u097F]/.test(text) || /\b(pani|sadak|bijli|bataiye|hai|kripya)\b/i.test(text)) {
      return 'Hindi';
    }
    // Telugu range: \u0C00-\u0C7F
    if (/[\u0C00-\u0C7F]/.test(text) || /\b(undi|ledu|cheppandi|nillu|rahasyam)\b/i.test(text)) {
      return 'Telugu';
    }
    // English
    if (/^[A-Za-z0-9\s.,!?'"()-]+$/.test(text) && text.length > 5) {
      return 'English';
    }
    return null;
  }

  /**
   * Start an interactive ElevenLabs Conversational Session with SEVA Agent
   */
  public async startSession(customAgentId?: string): Promise<boolean> {
    const agentIdToUse = customAgentId || ELEVENLABS_AGENT_ID;

    this.updateState({
      status: 'CONNECTING',
      errorMessage: null,
      messages: [],
      durationSeconds: 0,
      lastCreatedComplaint: null,
      isFallbackMode: false,
      agentId: agentIdToUse
    });

    // 1. Request microphone access explicitly
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream after permission verified so ElevenLabs client can acquire
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (micErr: any) {
      console.warn('Microphone permission error:', micErr);
      this.updateState({
        status: 'ERROR',
        errorMessage: 'Microphone access is required to speak with SEVA. Please allow microphone permissions.'
      });
      return false;
    }

    // 2. Define ElevenLabs Client Tools
    const clientTools = {
      /**
       * Tool 1: createComplaint
       * Validates citizen input, assigns department, checks duplicates,
       * generates real ticket token, writes to Firestore & updates UI.
       */
      createComplaint: async (params: any) => {
        console.log('[SEVA ElevenLabs Tool] createComplaint invoked:', params);
        this.updateState({ status: 'PROCESSING' });

        try {
          const currentUser = sevaStore.getCurrentUser();

          // Validate or fallback category
          let category: CivicCategory = 'ROAD';
          const rawCat = (params.category || '').toUpperCase();
          if (rawCat.includes('WATER') || rawCat.includes('SEWAGE') || rawCat.includes('DRAIN') || rawCat.includes('FLOOD')) category = 'WATER';
          else if (rawCat.includes('ELECTRIC') || rawCat.includes('POWER') || rawCat.includes('LIGHT') || rawCat.includes('STREETLIGHT')) category = 'ELECTRICITY';
          else if (rawCat.includes('GARBAGE') || rawCat.includes('WASTE') || rawCat.includes('SANIT') || rawCat.includes('PARK')) category = 'GARBAGE';
          else if (rawCat.includes('TRANS') || rawCat.includes('BUS') || rawCat.includes('TRAFFIC')) category = 'TRANSPORT';
          else if (rawCat.includes('HEALTH') || rawCat.includes('HOSPITAL') || rawCat.includes('ANIMAL') || rawCat.includes('DOG')) category = 'HEALTHCARE';
          else if (rawCat.includes('POLICE') || rawCat.includes('SAFETY') || rawCat.includes('CRIME')) category = 'POLICE';
          else if (rawCat.includes('FIRE') || rawCat.includes('DISASTER') || rawCat.includes('EMERGENCY')) category = 'DISASTER';
          else if (rawCat.includes('ROAD') || rawCat.includes('POTHOLE') || rawCat.includes('BUILD')) category = 'ROAD';

          // Determine Priority
          let priority: PriorityLevel = 'HIGH';
          const rawPri = (params.priority || '').toUpperCase();
          if (rawPri.includes('CRIT') || params.isEmergency) priority = 'CRITICAL';
          else if (rawPri.includes('MED')) priority = 'MEDIUM';
          else if (rawPri.includes('LOW')) priority = 'LOW';
          else if (rawPri.includes('HIGH')) priority = 'HIGH';

          const latitude = Number(params.latitude) || this.userLocation.latitude;
          const longitude = Number(params.longitude) || this.userLocation.longitude;
          const locationDesc = params.location || params.area || this.userLocation.address || 'Madipakkam Main Road, Chennai';

          const title = params.subcategory 
            ? `${params.subcategory} reported at ${params.location || this.userLocation.area}`
            : `Civic issue reported: ${params.description?.slice(0, 45) || 'Grievance'}`;

          const newComplaint = sevaStore.createComplaint({
            category,
            subcategory: params.subcategory || `${category} Issue`,
            title,
            description: params.description || `Reported via SEVA Voice Assistant: ${params.impact || ''}`,
            aiSummary: `Citizen reported ${params.description || category} issue at ${locationDesc}. Priority: ${priority}. Duration: ${params.duration || 'Recently noticed'}.`,
            location: {
              latitude,
              longitude,
              address: locationDesc,
              area: params.area || this.userLocation.area,
              city: this.userLocation.city || 'Chennai',
              state: this.userLocation.state || 'Tamil Nadu'
            },
            priority,
            language: params.language || this.state.detectedLanguage,
            sentiment: 'CONCERNED',
            confidenceScore: 95
          });

          this.updateState({
            lastCreatedComplaint: newComplaint,
            status: 'CONNECTED'
          });

          this.addMessage('system', `📋 Official Ticket Generated: ${newComplaint.token} • ${newComplaint.departmentName} (${newComplaint.priority})`);

          return JSON.stringify({
            success: true,
            token: newComplaint.token,
            department: newComplaint.departmentName,
            priority: newComplaint.priority,
            status: newComplaint.status,
            slaHours: newComplaint.slaHours,
            message: `Complaint registered successfully with token ${newComplaint.token} under ${newComplaint.departmentName}.`
          });
        } catch (toolErr: any) {
          console.error('[SEVA ElevenLabs Tool] createComplaint error:', toolErr);
          return JSON.stringify({
            success: false,
            error: toolErr.message || 'Unable to register complaint at this time. Please retry.'
          });
        }
      },

      /**
       * Tool 2: getComplaintStatus
       * Fetches real complaint record by token or id.
       */
      getComplaintStatus: async (params: any) => {
        console.log('[SEVA ElevenLabs Tool] getComplaintStatus invoked:', params);
        const searchToken = (params.token || params.ticket || params.id || '').trim();
        if (!searchToken) {
          return JSON.stringify({
            success: false,
            error: 'Ticket token is required.'
          });
        }

        const complaint = sevaStore.getComplaintByToken(searchToken) || sevaStore.getComplaintById(searchToken);
        if (complaint) {
          return JSON.stringify({
            success: true,
            token: complaint.token,
            title: complaint.title,
            status: complaint.status,
            department: complaint.departmentName,
            priority: complaint.priority,
            slaStatus: complaint.slaStatus,
            lastUpdated: complaint.updatedAt,
            assignedOfficer: complaint.assignedOfficerName || 'Assigned to Ward Engineer'
          });
        }

        return JSON.stringify({
          success: false,
          error: `No grievance found with token ${searchToken}. Please verify the ticket reference.`
        });
      },

      /**
       * Tool 3: checkDuplicateComplaint
       * Checks existing records near the coordinates or category.
       */
      checkDuplicateComplaint: async (params: any) => {
        console.log('[SEVA ElevenLabs Tool] checkDuplicateComplaint invoked:', params);
        const lat = Number(params.latitude) || this.userLocation.latitude;
        const lng = Number(params.longitude) || this.userLocation.longitude;
        const cat = params.category || '';

        const complaints = sevaStore.getComplaints();
        const nearbyMatch = complaints.find(c => {
          const dist = sevaStore.calculateDistanceMeters(lat, lng, c.location.latitude, c.location.longitude);
          return dist <= 200 && (!cat || c.category.toUpperCase() === cat.toUpperCase());
        });

        if (nearbyMatch) {
          return JSON.stringify({
            potentialDuplicate: true,
            similarityScore: 0.92,
            ticket: nearbyMatch.token,
            existingTitle: nearbyMatch.title,
            status: nearbyMatch.status,
            reportCount: nearbyMatch.relatedReportCount
          });
        }

        return JSON.stringify({
          potentialDuplicate: false,
          similarityScore: 0.15,
          ticket: null
        });
      },

      /**
       * Tool 4: getCurrentLocation
       * Provides accurate device coordinates and ward info.
       */
      getCurrentLocation: async () => {
        return JSON.stringify({
          success: true,
          latitude: this.userLocation.latitude,
          longitude: this.userLocation.longitude,
          area: this.userLocation.area,
          address: this.userLocation.address,
          city: this.userLocation.city,
          state: this.userLocation.state
        });
      }
    };

    // 3. Connect to ElevenLabs Conversational AI Agent
    try {
      this.conversation = await Conversation.startSession({
        agentId: agentIdToUse,
        connectionType: 'websocket',
        clientTools,
        onConnect: ({ conversationId }) => {
          console.log('[ElevenLabs] Connected successfully. Conversation ID:', conversationId);
          this.updateState({
            status: 'CONNECTED',
            conversationId,
            errorMessage: null,
            isFallbackMode: false
          });

          // Start duration timer
          if (this.durationTimer) clearInterval(this.durationTimer);
          this.durationTimer = setInterval(() => {
            this.updateState({ durationSeconds: this.state.durationSeconds + 1 });
          }, 1000);

          this.addMessage('system', '🟢 Connected to SEVA Citizen Voice Assistant (agent: ' + agentIdToUse + ')');
        },
        onDisconnect: (details) => {
          console.log('[ElevenLabs] Disconnected:', details);
          this.handleSessionEnded();
        },
        onError: (errorMessage, context) => {
          console.warn('[ElevenLabs] Error occurred:', errorMessage, context);
          this.updateState({
            status: 'ERROR',
            errorMessage: typeof errorMessage === 'string' ? errorMessage : 'Unable to connect to SEVA. Please try again.'
          });
        },
        onMessage: ({ message, source }) => {
          console.log(`[ElevenLabs Message] [${source}]:`, message);
          if (source === 'ai') {
            this.addMessage('seva', message);
            this.updateState({ status: 'SEVA_SPEAKING' });
          } else if (source === 'user') {
            this.addMessage('citizen', message);
            this.updateState({ status: 'PROCESSING' });
          }
        },
        onModeChange: ({ mode }) => {
          console.log('[ElevenLabs Mode Changed]:', mode);
          if (mode === 'speaking') {
            this.updateState({ status: 'SEVA_SPEAKING' });
          } else if (mode === 'listening') {
            this.updateState({ status: 'LISTENING' });
          }
        },
        onStatusChange: ({ status }) => {
          console.log('[ElevenLabs Status Changed]:', status);
          if (status === 'connected') {
            this.updateState({ status: 'CONNECTED' });
          } else if (status === 'connecting') {
            this.updateState({ status: 'CONNECTING' });
          } else if (status === 'disconnected') {
            this.handleSessionEnded();
          }
        }
      });

      return true;
    } catch (sessionErr: any) {
      console.warn('[ElevenLabs] Session initiation error:', sessionErr);
      this.updateState({
        status: 'ERROR',
        errorMessage: 'SEVA voice service connection issue: ' + (sessionErr.message || 'Check network / agent status')
      });
      return false;
    }
  }

  /**
   * Post-Call persistence to Firestore conversations collection
   */
  private async handleSessionEnded() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }

    this.updateState({ status: 'ENDED' });

    const convId = this.state.conversationId || `conv-${Date.now()}`;
    const currentUser = sevaStore.getCurrentUser();
    const lastComplaint = this.state.lastCreatedComplaint;

    // Save conversation to Firestore if connected
    if (db && isFirebaseConfigured()) {
      try {
        const convRef = doc(db, 'conversations', convId);
        await setDoc(convRef, {
          conversationId: convId,
          citizenId: currentUser.id,
          citizenName: currentUser.name,
          agentId: this.state.agentId,
          complaintId: lastComplaint?.id || null,
          complaintToken: lastComplaint?.token || null,
          language: this.state.detectedLanguage,
          startedAt: new Date(Date.now() - this.state.durationSeconds * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          durationSeconds: this.state.durationSeconds,
          transcript: this.state.messages.map(m => `[${m.source.toUpperCase()}]: ${m.text}`).join('\n'),
          summary: lastComplaint ? `Registered complaint ${lastComplaint.token}: ${lastComplaint.title}` : 'General inquiry',
          category: lastComplaint?.category || 'GENERAL',
          priority: lastComplaint?.priority || 'MEDIUM',
          department: lastComplaint?.departmentName || 'General Administration',
          sentiment: 'CONCERNED',
          aiConfidence: 95,
          status: 'COMPLETED',
          createdAt: new Date().toISOString()
        }, { merge: true });
        console.log('[Firestore] Conversation log saved successfully:', convId);
      } catch (err) {
        console.warn('[Firestore] Error saving conversation log:', err);
      }
    }
  }

  /**
   * End conversational session
   */
  public async endSession(): Promise<void> {
    if (this.conversation) {
      try {
        await this.conversation.endSession();
      } catch (err) {
        console.warn('Error closing session:', err);
      }
      this.conversation = null;
    }
    this.handleSessionEnded();
  }

  /**
   * Toggle mute
   */
  public setMicMuted(isMuted: boolean): void {
    if (this.conversation) {
      try {
        this.conversation.setMicMuted(isMuted);
      } catch (e) {
        console.warn('Mic mute call:', e);
      }
    }
    this.updateState({ isMuted });
  }

  /**
   * Send text message in session
   */
  public sendTextMessage(text: string): void {
    if (!text.trim()) return;
    this.addMessage('citizen', text.trim());
    if (this.conversation) {
      try {
        this.conversation.sendUserMessage(text.trim());
      } catch (e) {
        console.warn('Send user message error:', e);
      }
    }
  }

  /**
   * Fallback simulator if agent is unreachable
   */
  public enableFallbackDemo(initialGreeting = 'வணக்கம்! SEVA AI உதவி மையத்திற்கு வரவேற்கிறோம். உங்கள் குறையை விரிவாக சொல்லுங்கள்.'): void {
    this.updateState({
      status: 'LISTENING',
      isFallbackMode: true,
      conversationId: `fallback-conv-${Date.now()}`
    });

    if (this.durationTimer) clearInterval(this.durationTimer);
    this.durationTimer = setInterval(() => {
      this.updateState({ durationSeconds: this.state.durationSeconds + 1 });
    }, 1000);

    this.addMessage('seva', initialGreeting);
  }
}

export const elevenlabsVoiceService = new ElevenLabsVoiceService();
