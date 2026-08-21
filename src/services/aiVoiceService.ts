import { CivicCategory, PriorityLevel, SentimentType, GeoLocation } from '../types';

export interface VoiceSessionState {
  stage: 'GREETING' | 'LISTENING_INITIAL' | 'ASKING_FOLLOWUP' | 'DUPLICATE_CHECK' | 'SUMMARY_CONFIRM' | 'CREATING_TICKET' | 'COMPLETED' | 'ERROR';
  detectedLanguage: string;
  detectedLangCode: 'en-IN' | 'ta-IN' | 'hi-IN' | 'te-IN' | 'en-US';
  category?: CivicCategory;
  subcategory?: string;
  priority: PriorityLevel;
  sentiment: SentimentType;
  confidenceScore: number;
  extractedDetails: {
    problem?: string;
    landmark?: string;
    duration?: string;
    severity?: string;
    affectedPeople?: string;
    specificIssue?: string;
  };
  aiSummary?: string;
  generatedTicketToken?: string;
  createdComplaintId?: string;
  isListening: boolean;
  isSpeaking: boolean;
  errorMessage?: string;
}

export interface DialogueMessage {
  id: string;
  sender: 'SEVA' | 'CITIZEN';
  text: string;
  timestamp: string;
  audioDurationSec?: number;
  highlightCategory?: string;
}

// Multilingual Greetings & System Responses
export const VOICE_RESPONSES = {
  ta: {
    name: 'Tamil (தமிழ்)',
    greeting: 'வணக்கம்! நான் SEVA AI குடிமக்கள் உதவியாளர். உங்கள் பகுதியில் உள்ள குறையை அல்லது பிரச்சினையை கூறுங்கள்.',
    askCategoryDetails: {
      ROAD: 'சாலை பாதிப்பு குறித்து கூறினீர்கள். இது பெரிய பள்ளமா (Pothole), உடைந்த சாக்கடை மூடியா அல்லது வெள்ளப்பெருக்கா? அருகில் உள்ள முக்கிய லேண்ட்மார்க் மற்றும் எத்தனை நாட்களாக உள்ளது?',
      WATER: 'குடிநீர் பிரச்சினை குறித்து கூறினீர்கள். நீர் விநியோகம் இல்லையா, குறைவான அழுத்தமா, பைப் உடைப்பா அல்லது கழிவுநீர் கலக்கிறதா? எத்தனை வீடுகள் பாதிக்கப்பட்டுள்ளன?',
      ELECTRICITY: 'மின்சார பிரச்சினை குறித்து கூறினீர்கள். மின் தடை, மின்கம்பி அறுந்து விழுதல் அல்லது டிரான்ஸ்பார்மர் தீப்பொறியா? உடனடியாக ஏதேனும் ஆபத்து உள்ளதா?',
      GARBAGE: 'குப்பை கழிவு குறித்து கூறினீர்கள். குப்பை தொட்டி நிரம்பி வழிகிறதா அல்லது எத்தனை நாட்களாக அள்ளப்படவில்லை? சுகாதார சீர்கேடு உள்ளதா?',
      TRANSPORT: 'போக்குவரத்து குறை குறித்து கூறினீர்கள். சிக்னல் பழுதா, பேருந்து நிறுத்த சேதமா அல்லது போக்குவரத்து நெரிசலா?',
      HEALTHCARE: 'பொது சுகாதாரம் குறித்து கூறினீர்கள். கொசு உற்பத்தி, தெருநாய் தொல்லை அல்லது ஆரம்ப சுகாதார நிலைய குறையா?',
      POLICE: 'பொது பாதுகாப்பு குறித்து கூறினீர்கள். உடனடி அவசர பாதுகாப்பு பிரச்சினையா?',
      DISASTER: 'பேரிடர் அவசரநிலை குறித்து கூறினீர்கள். மழைநீர் தேக்கம் அல்லது மரம் விழுந்துள்ளதா? பாதுகாப்பு உதவி தேவைப்படுகிறதா?'
    },
    criticalWarning: 'எச்சரிக்கை: உடனடி உயிராபத்து கண்டறியப்பட்டது. மின்சார/தீயணைப்பு அவசர பிரிவுக்கு தகவல் அனுப்பப்படுகிறது. தயவுசெய்து பாதுகாப்பான தூரத்தில் இருங்கள்!',
    confirmPrompt: (summary: string) => `நீங்கள் கூறிய விபரம்:\n"${summary}"\n\nஇந்த புகாரை அதிகாரப்பூர்வமாக பதிவு செய்யலாமா? 'ஆம் / Submit' என்று கூறுங்கள்.`,
    ticketCreated: (token: string, dept: string) => `உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது! உங்கள் டிக்கெட் எண்: ${token}. இது ${dept} துறைக்கு அனுப்பப்பட்டுள்ளது. துல்லியமான சரிபார்ப்புக்கு தயவுசெய்து நேரடி புகைப்படத்தை பதிவேற்றுங்கள்.`
  },
  en: {
    name: 'English',
    greeting: 'Hello! I am SEVA, your civic grievance assistant. Please describe the civic issue you are facing in your neighborhood.',
    askCategoryDetails: {
      ROAD: 'Understood, regarding the road issue: Is it a deep pothole, broken drain slab, or waterlogging? What is the nearest landmark, and how long has it existed?',
      WATER: 'Regarding the water issue: Is there complete supply stoppage, contamination/bad smell, low pressure, or a broken pipeline? How many households are impacted?',
      ELECTRICITY: 'Regarding electricity: Is it a power outage, snapped live wire, sparking transformer, or streetlight failure? Is there any immediate electrocution hazard?',
      GARBAGE: 'Regarding sanitation: Is it an overflowing waste bin, missed door-to-door collection, or open dumping? How many days has it been accumulating?',
      TRANSPORT: 'Regarding transport: Is it a broken traffic signal, damaged bus shelter, or road encroachment causing traffic congestion?',
      HEALTHCARE: 'Regarding public health: Is it stagnant water/mosquito breeding, stray animal menace, or local health center infrastructure?',
      POLICE: 'Regarding safety: Is there an immediate public hazard or illegal obstruction requiring civic police intervention?',
      DISASTER: 'EMERGENCY: Is there severe waterlogging, tree fall, or structural collapse risk requiring disaster response squads?'
    },
    criticalWarning: 'CRITICAL SAFETY ALERT: Live hazard detected. Priority elevated to CRITICAL. Emergency dispatch notification sent to rapid response units. Please stay at a safe distance.',
    confirmPrompt: (summary: string) => `Here is the summary of your grievance:\n"${summary}"\n\nWould you like me to submit this official complaint now? Say 'Yes' or click Submit.`,
    ticketCreated: (token: string, dept: string) => `Grievance registered successfully! Your official Ticket Token is: ${token}. Routed to: ${dept}. Please capture and upload a geo-tagged photo for evidence verification.`
  },
  hi: {
    name: 'Hindi (हिंदी)',
    greeting: 'नमस्ते! मैं सेवा (SEVA) नागरिक शिकायत सहायक हूँ। कृपया अपने क्षेत्र की समस्या बताएं।',
    askCategoryDetails: {
      ROAD: 'सड़क समस्या: क्या यह गहरा गड्ढा (पॉटहोल), टूटा नाला या जलभराव है? निकटतम लैंडमार्क और कितने दिनों से यह समस्या है?',
      WATER: 'जल आपूर्ति: क्या पानी नहीं आ रहा, गंदा/दुर्गंधयुक्त पानी है, या पाइपलाइन लीक है? कितने परिवार प्रभावित हैं?',
      ELECTRICITY: 'बिजली समस्या: क्या बिजली गुल है, टूटा हुआ चालू तार है, या ट्रांसफार्मर स्पार्क हो रहा है? क्या कोई तुरंत खतरा है?',
      GARBAGE: 'कचरा समस्या: क्या कूड़ेदान ओवरफ्लो है या कई दिनों से कचरा नहीं उठा? कितने दिनों से जमा है?',
      TRANSPORT: 'यातायात समस्या: क्या ट्रैफिक सिग्नल खराब है या बस स्टॉप क्षतिग्रस्त है?',
      HEALTHCARE: 'स्वास्थ्य समस्या: क्या मच्छर पनप रहे हैं या कोई अन्य सार्वजनिक स्वास्थ्य समस्या है?',
      POLICE: 'सार्वजनिक सुरक्षा: क्या कोई तात्कालिक खतरा या अतिक्रमण है?',
      DISASTER: 'आपदा आपातकाल: क्या भारी जलभराव या पेड़ गिरने का खतरा है?'
    },
    criticalWarning: 'चेतावनी: गंभीर खतरा पहचाना गया। प्राथमिकता CRITICAL कर दी गई है। कृपया सुरक्षित दूरी बनाए रखें।',
    confirmPrompt: (summary: string) => `आपकी शिकायत का विवरण:\n"${summary}"\n\nक्या आप इस शिकायत को दर्ज करना चाहते हैं? 'हाँ / Submit' कहें।`,
    ticketCreated: (token: string, dept: string) => `आपकी शिकायत दर्ज हो गई है! टिकट संख्या: ${token}। यह ${dept} को भेजी गई है। कृपया सबूत के लिए फोटो अपलोड करें।`
  },
  te: {
    name: 'Telugu (తెలుగు)',
    greeting: 'నమస్కారం! నేను SEVA పౌర సేవా సహాయకుడిని. మీ ప్రాంతంలోని సమస్యను తెలియజేయండి.',
    askCategoryDetails: {
      ROAD: 'రోడ్డు సమస్య: ఇది పెద్ద గుంత (Pothole), డ్రైనేజీ మూత పగులడం లేదా నీరు నిలవడమా? ఎన్ని రోజులుగా ఉంది?',
      WATER: 'నీటి సమస్య: నీరు రావట్లేదా, కలుషిత నీరా లేదా పైప్‌లైన్ లీకేజా? ఎన్ని ఇళ్ళు ప్రభావితమయ్యాయి?',
      ELECTRICITY: 'విద్యుత్ సమస్య: కరెంట్ పోయిందా, తెగిపడిన తీగ లేదా ట్రాన్స్‌ఫార్మర్ స్పార్క్ అవుతుందా?',
      GARBAGE: 'చెత్త సమస్య: డస్ట్‌బిన్ నిండిపోయిందా లేదా ఎన్ని రోజులుగా చెత్త తీయలేదు?',
      TRANSPORT: 'రవాణా సమస్య: ట్రాఫిక్ సిగ్నల్ సమస్య లేదా రోడ్డు ఆక్రమణల?',
      HEALTHCARE: 'ప్రజా ఆరోగ్యం: దోమల బెడద లేదా వీధి కుక్కల సమస్య?',
      POLICE: 'ప్రజా భద్రత సమస్య వివరాలు తెలపండి.',
      DISASTER: 'విపత్తు అత్యవసర పరిస్థితి వివరాలు తెలపండి.'
    },
    criticalWarning: 'హెచ్చరిక: అత్యవసర భద్రతా ప్రమాదం గుర్తించబడింది. దయచేసి సురక్షిత దూరంలో ఉండండి.',
    confirmPrompt: (summary: string) => `మీ ఫిర్యాదు వివరాలు:\n"${summary}"\n\nఈ ఫిర్యాదును నమోదు చేయమంటారా? 'అవును' అనండి.`,
    ticketCreated: (token: string, dept: string) => `మీ ఫిర్యాదు విజయవంతంగా నమోదైంది! టికెట్ నంబర్: ${token}.`
  }
};

// NLP Classifier & Semantic Extraction Engine
export class SevaAiVoiceEngine {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private currentLanguage: 'en' | 'ta' | 'hi' | 'te' = 'en';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public initSpeechRecognition(
    langCode: 'en-IN' | 'ta-IN' | 'hi-IN' | 'te-IN' | 'en-US',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): boolean {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = langCode;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event);
        onError(event);
      };

      this.recognition.onend = () => {
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      onError(e);
      return false;
    }
  }

  public stopSpeechRecognition() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  public speak(text: string, lang: 'en' | 'ta' | 'hi' | 'te', onEnd?: () => void) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const langMap: Record<string, string> = {
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        en: 'en-IN'
      };
      utterance.lang = langMap[lang] || 'en-IN';

      // Pick high quality natural Indian voice if available
      const voices = this.synth.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(lang) || v.lang.replace('_', '-').startsWith(langMap[lang]));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis execution failed:', e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Language Detection from Text
  public detectLanguage(text: string): { lang: 'en' | 'ta' | 'hi' | 'te'; langCode: 'en-IN' | 'ta-IN' | 'hi-IN' | 'te-IN'; name: string } {
    // Unicode range checks
    const tamilRegex = /[\u0B80-\u0BFF]/;
    const hindiRegex = /[\u0900-\u097F]/;
    const teluguRegex = /[\u0C00-\u0C7F]/;

    // Transliteration keyword checks
    const tamilKeywords = ['irukku', 'periya', 'saalai', 'thanni', 'kuppai', 'koodadhu', 'illai', 'illa', 'romba', 'pothole', 'koot', 'roadla'];
    const hindiKeywords = ['paani', 'sadak', 'bijli', 'kachra', 'bahut', 'hai', 'kharab', 'gaddha', 'nahi', 'raha'];
    const teluguKeywords = ['neellu', 'roadu', 'ledu', 'chala', 'guntha', 'undi', 'chetha'];

    const lower = text.toLowerCase();

    if (tamilRegex.test(text) || tamilKeywords.some(k => lower.includes(k))) {
      return { lang: 'ta', langCode: 'ta-IN', name: 'Tamil (தமிழ்)' };
    }
    if (hindiRegex.test(text) || hindiKeywords.some(k => lower.includes(k))) {
      return { lang: 'hi', langCode: 'hi-IN', name: 'Hindi (हिंदी)' };
    }
    if (teluguRegex.test(text) || teluguKeywords.some(k => lower.includes(k))) {
      return { lang: 'te', langCode: 'te-IN', name: 'Telugu (తెలుగు)' };
    }

    return { lang: 'en', langCode: 'en-IN', name: 'English' };
  }

  // Analyze citizen problem statement to classify Category, Subcategory, Priority, Sentiment
  public analyzeCitizenSpeech(text: string, userLocation?: GeoLocation): {
    category: CivicCategory;
    subcategory: string;
    priority: PriorityLevel;
    sentiment: SentimentType;
    confidenceScore: number;
    departmentName: string;
    departmentId: string;
    isCriticalSafety: boolean;
    extractedEntities: {
      duration?: string;
      landmark?: string;
      affectedCount?: string;
      problem?: string;
    };
    aiSummary: string;
  } {
    const lower = text.toLowerCase();

    // Critical Safety Keyword Detection (Deterministic Safety Rules)
    const criticalWords = [
      'sparking', 'live wire', 'current wire', 'snapped wire', 'fallen wire', 
      'electrocution', 'fire', 'explosion', 'gas leak', 'major flood', 
      'building collapse', 'wall collapse', 'child trapped', 'deep sinkhole',
      'மின்சாரம் பாய்கிறது', 'கம்பி அறுந்து', 'தீ விபத்து'
    ];
    const isCritical = criticalWords.some(w => lower.includes(w));

    // Category Identification
    let category: CivicCategory = 'ROAD';
    let subcategory = 'POTHOLE';
    let deptName = 'Municipal Corporation (Roads & Works)';
    let deptId = 'dept-road';
    let confidence = 92;

    if (
      lower.includes('water') || lower.includes('thanni') || lower.includes('paani') || 
      lower.includes('leak') || lower.includes('pipe') || lower.includes('sewage') || 
      lower.includes('drainage') || lower.includes('contamination') || lower.includes('குடிநீர்') ||
      lower.includes('கழிவுநீர்') || lower.includes('சாக்கடை')
    ) {
      category = 'WATER';
      deptName = 'Water Supply & Sewerage Board (CMWSSB)';
      deptId = 'dept-water';
      if (lower.includes('sewage') || lower.includes('drainage') || lower.includes('சாக்கடை')) {
        subcategory = 'SEWAGE_OVERFLOW';
      } else if (lower.includes('burst') || lower.includes('broken pipe') || lower.includes('leak')) {
        subcategory = 'PIPE_BURST';
      } else if (lower.includes('brown') || lower.includes('smell') || lower.includes('contamination') || lower.includes('dirt')) {
        subcategory = 'CONTAMINATION';
      } else {
        subcategory = 'NO_SUPPLY';
      }
      confidence = 95;
    } else if (
      lower.includes('electric') || lower.includes('current') || lower.includes('power') || 
      lower.includes('wire') || lower.includes('transformer') || lower.includes('voltage') || 
      lower.includes('streetlight') || lower.includes('light') || lower.includes('மின்சாரம்') ||
      lower.includes('மின் விளக்கு') || lower.includes('டிரான்ஸ்பார்மர்')
    ) {
      category = 'ELECTRICITY';
      deptName = 'Electricity Distribution Corporation (TANGEDCO)';
      deptId = 'dept-elec';
      if (lower.includes('wire') || lower.includes('snapped') || lower.includes('spark')) {
        subcategory = 'FALLEN_WIRE';
      } else if (lower.includes('transformer')) {
        subcategory = 'TRANSFORMER_BLOW';
      } else if (lower.includes('streetlight') || lower.includes('light')) {
        subcategory = 'STREETLIGHT_OUT';
      } else {
        subcategory = 'POWER_OUTAGE';
      }
      confidence = 96;
    } else if (
      lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || 
      lower.includes('kuppai') || lower.includes('kachra') || lower.includes('dump') || 
      lower.includes('bin') || lower.includes('குப்பை')
    ) {
      category = 'GARBAGE';
      deptName = 'Solid Waste Management & Sanitation';
      deptId = 'dept-garb';
      if (lower.includes('overflow') || lower.includes('spilling')) {
        subcategory = 'OVERFLOW';
      } else if (lower.includes('missed') || lower.includes('not collected')) {
        subcategory = 'MISSED_COLLECTION';
      } else {
        subcategory = 'ILLEGAL_DUMPING';
      }
      confidence = 94;
    } else if (
      lower.includes('bus') || lower.includes('traffic') || lower.includes('signal') || 
      lower.includes('stop') || lower.includes('parking') || lower.includes('சிக்னல்') || 
      lower.includes('பேருந்து')
    ) {
      category = 'TRANSPORT';
      deptName = 'Metropolitan Transport & Traffic Infra';
      deptId = 'dept-trans';
      subcategory = lower.includes('signal') ? 'TRAFFIC_SIGNAL' : 'BUS_STOP_DAMAGE';
      confidence = 90;
    } else if (
      lower.includes('hospital') || lower.includes('clinic') || lower.includes('mosquito') || 
      lower.includes('dog') || lower.includes('stray') || lower.includes('கொசு') || 
      lower.includes('நாய்')
    ) {
      category = 'HEALTHCARE';
      deptName = 'Public Health & Disease Prevention';
      deptId = 'dept-health';
      subcategory = lower.includes('mosquito') ? 'MOSQUITO_BREEDING' : 'STRAY_DOG_MENACE';
      confidence = 89;
    } else if (
      lower.includes('flood') || lower.includes('tree fall') || lower.includes('cyclone') || 
      lower.includes('வெள்ளம்') || lower.includes('மரம் விழுந்து')
    ) {
      category = 'DISASTER';
      deptName = 'Disaster Management & Flood Control Cell';
      deptId = 'dept-disaster';
      subcategory = lower.includes('tree') ? 'FALLEN_TREE' : 'WATER_LOGGING';
      confidence = 96;
    } else {
      // Default to Road
      category = 'ROAD';
      deptName = 'Municipal Corporation (Roads & Works)';
      deptId = 'dept-road';
      if (lower.includes('slab') || lower.includes('drain cover') || lower.includes('சாக்கடை மூடி')) {
        subcategory = 'ROAD_DAMAGE';
      } else {
        subcategory = 'POTHOLE';
      }
      confidence = 91;
    }

    // Determine Priority
    let priority: PriorityLevel = 'MEDIUM';
    if (isCritical) {
      priority = 'CRITICAL';
    } else if (
      category === 'ROAD' && (subcategory === 'POTHOLE' || subcategory === 'ROAD_DAMAGE') ||
      category === 'WATER' && subcategory === 'CONTAMINATION' ||
      category === 'ELECTRICITY' && (subcategory === 'TRANSFORMER_BLOW' || subcategory === 'FALLEN_WIRE') ||
      lower.includes('danger') || lower.includes('accident') || lower.includes('severe') || lower.includes('emergency')
    ) {
      priority = 'HIGH';
    } else if (lower.includes('minor') || subcategory === 'STREETLIGHT_OUT') {
      priority = 'LOW';
    }

    // Sentiment Classification
    let sentiment: SentimentType = 'NEUTRAL';
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('emergency') || isCritical) {
      sentiment = 'URGENT';
    } else if (lower.includes('angry') || lower.includes('worst') || lower.includes('no action') || lower.includes('again') || lower.includes('waste')) {
      sentiment = 'ANGRY';
    } else if (lower.includes('frustrated') || lower.includes('tired') || lower.includes('many days') || lower.includes('many times')) {
      sentiment = 'FRUSTRATED';
    } else if (lower.includes('worry') || lower.includes('scared') || lower.includes('concerned') || lower.includes('risk') || lower.includes('hazard')) {
      sentiment = 'CONCERNED';
    }

    // Entity Extraction
    const extractedEntities: { duration?: string; landmark?: string; affectedCount?: string; problem?: string } = {
      problem: text
    };

    // Duration extraction
    const dayMatch = text.match(/(\d+)\s*(days|weeks|months|naala|varusama|dina|din)/i);
    if (dayMatch) {
      extractedEntities.duration = `${dayMatch[1]} ${dayMatch[2]}`;
    } else if (lower.includes('yesterday')) {
      extractedEntities.duration = '1 day (since yesterday)';
    } else if (lower.includes('today')) {
      extractedEntities.duration = 'Today';
    } else {
      extractedEntities.duration = 'Ongoing recent issue';
    }

    // Landmark / Area
    const locArea = userLocation?.area || 'Madipakkam, Chennai';
    extractedEntities.landmark = userLocation?.landmark || `Near ${locArea} Main Road`;

    // AI Summary
    const subcatFormatted = subcategory.replace(/_/g, ' ').toLowerCase();
    const aiSummary = `Citizen reported ${subcatFormatted} near ${extractedEntities.landmark} (${locArea}). Issue duration: ${extractedEntities.duration}. Safety priority assessed as ${priority}. Routed to ${deptName}.`;

    return {
      category,
      subcategory,
      priority,
      sentiment,
      confidenceScore: confidence,
      departmentName: deptName,
      departmentId: deptId,
      isCriticalSafety: isCritical,
      extractedEntities,
      aiSummary
    };
  }
}

export const sevaAiEngine = new SevaAiVoiceEngine();
