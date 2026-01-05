
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, X, Sparkles, Volume2, Waves } from 'lucide-react';

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveSession: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const inputAudioCtx = useRef<AudioContext | null>(null);
  const outputAudioCtx = useRef<AudioContext | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTime = useRef(0);

  const startSession = async () => {
    setIsActive(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    inputAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioCtx.current.createGain();
    outputNode.connect(outputAudioCtx.current.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          const source = inputAudioCtx.current!.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioCtx.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioCtx.current!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) {
            setTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
          }
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            nextStartTime.current = Math.max(nextStartTime.current, outputAudioCtx.current!.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioCtx.current!, 24000, 1);
            const source = outputAudioCtx.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.start(nextStartTime.current);
            nextStartTime.current += audioBuffer.duration;
            sources.current.add(source);
            source.onended = () => sources.current.delete(source);
          }
          if (message.serverContent?.interrupted) {
            sources.current.forEach(s => s.stop());
            sources.current.clear();
            nextStartTime.current = 0;
          }
        },
        onerror: (e) => console.error('Live API Error:', e),
        onclose: () => setIsActive(false),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction: 'You are a real-time data analysis assistant. Help users understand their reports through natural conversation.',
        outputAudioTranscription: {}
      }
    });

    sessionRef.current = await sessionPromise;
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (inputAudioCtx.current) inputAudioCtx.current.close();
    if (outputAudioCtx.current) outputAudioCtx.current.close();
    setIsActive(false);
    onClose();
  };

  useEffect(() => {
    startSession();
    return () => stopSession();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-lg p-12 rounded-[3rem] shadow-2xl text-center space-y-8 relative">
        <button onClick={stopSession} className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
        
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 animate-pulse">
           <Waves className="w-12 h-12 text-white" />
        </div>

        <div className="space-y-2">
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Live AI Consultation</h2>
           <p className="text-slate-400 font-medium">Conversing with Gemini Native Audio...</p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 min-h-[160px] flex items-center justify-center border border-slate-100 relative overflow-hidden">
           {isActive && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-600 animate-progress origin-left" />
           )}
           <p className="text-slate-600 italic leading-relaxed text-sm">
             {transcription || "Listening for your voice... Ask anything about your data reports."}
           </p>
        </div>

        <div className="flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-xs font-bold">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Connection Stable
           </div>
           <button onClick={stopSession} className="bg-red-50 text-red-600 px-6 py-2 rounded-2xl text-xs font-bold hover:bg-red-100 transition-colors">
             End Session
           </button>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
