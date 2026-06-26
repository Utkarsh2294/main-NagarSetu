import { useState, useEffect, useRef } from "react";
import { Send, Phone, ImageIcon, Video, X, Navigation, Mic, MicOff } from "lucide-react";

/* ─── Bot conversation flow ─── */
const BOT_STEPS = ["welcome", "askName", "askEmail", "askLocation", "askMedia", "askIssue", "submitted"];
const MAX_MEDIA = 5;

/* ─── Chat Bubbles ─── */
function BotBubble({ children, typing = false }) {
  return (
    <div className="self-start flex items-end gap-1.5 max-w-[88%] mr-auto">
      <div className="w-6 h-6 bg-emerald-700 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mb-0.5 shadow-md">NS</div>
      <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none px-3 py-2 shadow-md text-xs space-y-1 relative">
        {typing ? (
          <div className="flex gap-1 items-center py-1 px-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : children}
      </div>
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div className="self-end max-w-[80%] ml-auto">
      <div className="bg-[#d9fdd3] text-slate-800 rounded-2xl rounded-tr-none px-3 py-2 shadow-md text-xs relative">
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════ */
export default function WhatsAppSimulator({ onSimulateReport, loading }) {
  const [sender] = useState(`+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`);

  /* ── Bot simulator state ── */
  const [botStep, setBotStep]           = useState("welcome");
  const [botMessages, setBotMessages]   = useState([]);
  const [botInput, setBotInput]         = useState("");
  const [botTyping, setBotTyping]       = useState(false);
  
  const [botName, setBotName]           = useState("");
  const [botEmail, setBotEmail]         = useState("");
  const [botLocation, setBotLocation]   = useState(null);
  const [botMediaFiles, setBotMediaFiles] = useState([]);
  const [botIssue, setBotIssue]         = useState("");
  const [botSubmitted, setBotSubmitted] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null);

  /* ── Voice typing state ── */
  const [isRecording, setIsRecording]   = useState(false);

  /* ── Refs ── */
  const botChatEndRef  = useRef(null);
  const botFileRef     = useRef(null);

  useEffect(() => { botChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [botMessages, botTyping]);

  /* ── Boot the bot with welcome message ── */
  useEffect(() => {
    const welcome = {
      id: "bot-welcome",
      from: "bot",
      content: (
        <div className="space-y-1.5">
          <p>👋 <strong>Welcome to NagarSetu!</strong></p>
          <p className="text-slate-600">I'm your civic reporting assistant. I'll help you log an issue in your area quickly.</p>
          <p className="text-slate-600 mt-1">Let's start — what's your <strong>full name</strong>?</p>
        </div>
      ),
      text: "welcome"
    };
    setBotMessages([welcome]);
    setBotStep("askName");
  }, []);

  /* ── Bot: push message with typing delay ── */
  const pushBotMessage = (content, delay = 900) => {
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setBotMessages(prev => [...prev, { id: Date.now() + Math.random(), from: "bot", content }]);
    }, delay);
  };

  /* ── Bot: handle user send ── */
  const handleBotSend = () => {
    const val = botInput.trim();
    if (!val && botStep !== "askMedia" && botStep !== "askLocation") return;

    /* Push user bubble */
    if (val) {
      setBotMessages(prev => [...prev, { id: Date.now(), from: "user", content: val }]);
      setBotInput("");
    }

    if (botStep === "askName") {
      if (!val) return;
      setBotName(val);
      pushBotMessage(
        <div className="space-y-1">
          <p>Nice to meet you, <strong>{val}</strong>! 😊</p>
          <p className="text-slate-600">Now please share your <strong>email address</strong> so we can send you updates on your report.</p>
        </div>
      );
      setBotStep("askEmail");

    } else if (botStep === "askEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        pushBotMessage(
          <p className="text-red-500">⚠️ That doesn't look like a valid email. Please enter a valid address (e.g. name@gmail.com).</p>
        );
        return;
      }
      setBotEmail(val);
      pushBotMessage(
        <div className="space-y-1">
          <p>✅ Got it! We'll keep <strong>{val}</strong> updated.</p>
          <p className="text-slate-600">Next — can you <strong>share your location</strong>? Tap the 📍 pin button below or type your area name.</p>
        </div>
      );
      setBotStep("askLocation");

    } else if (botStep === "askLocation") {
      if (botLocation) {
        pushBotMessage(
          <div className="space-y-1">
            <p>📍 Location confirmed!</p>
            <p className="text-slate-600">Now <strong>attach photos or videos</strong> of the issue (up to 5), or tap <em>Skip</em> to continue.</p>
          </div>
        );
        setBotStep("askMedia");
      } else if (val) {
        const fakeCoords = { lat: 12.9716 + (Math.random() - 0.5) * 0.05, lng: 77.5946 + (Math.random() - 0.5) * 0.05, source: "text" };
        setBotLocation(fakeCoords);
        pushBotMessage(
          <div className="space-y-1">
            <p>📍 Got your area: <strong>{val}</strong></p>
            <p className="text-slate-600">Now <strong>attach photos or videos</strong> of the issue (up to 5), or tap <em>Skip</em> to continue.</p>
          </div>
        );
        setBotStep("askMedia");
      } else {
        pushBotMessage(<p className="text-slate-600">Please share a location — either use the 📍 GPS button or type your area name.</p>);
      }

    } else if (botStep === "askMedia") {
      pushBotMessage(
        <div className="space-y-1">
          <p>👍 {botMediaFiles.length > 0 ? `${botMediaFiles.length} file(s) received!` : "No media — that's okay!"}</p>
          <p className="text-slate-600">Finally, <strong>describe the issue</strong> in a few words. Be specific — include road name, landmark, severity.</p>
        </div>
      );
      setBotStep("askIssue");

    } else if (botStep === "askIssue") {
      if (!val) return;
      setBotIssue(val);
      setBotStep("submitted");
      setBotSubmitted(true);
      
      onSimulateReport?.({
        sender: sender,
        message: val,
        lat: botLocation?.lat || 12.9716,
        lng: botLocation?.lng || 77.5946,
        imageBase64: botMediaFiles[0]?.base64 || undefined,
        citizenName: botName,
        citizenEmail: botEmail,
        mediaFiles: botMediaFiles
      });

      pushBotMessage(
        <div className="space-y-2">
          <p>🚨 <strong>Report Submitted!</strong></p>
          <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-[10px] font-mono space-y-0.5 text-slate-600">
            <div>• <strong>Name:</strong> {botName}</div>
            <div>• <strong>Email:</strong> {botEmail}</div>
            <div>• <strong>Issue:</strong> {val}</div>
            <div>• <strong>Media:</strong> {botMediaFiles.length} file(s)</div>
            <div>• <strong>Status:</strong> Logged ✅</div>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold">📧 Confirmation sent to {botEmail}</p>
        </div>,
        1200
      );
    }
  };

  /* ── Bot: GPS for simulator ── */
  const handleBotGPS = () => {
    if (!navigator.geolocation) return;
    pushBotMessage(<div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />, 10);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude, source: "gps" };
        setBotLocation(loc);
        setBotMessages(prev => prev.filter(m => m.from !== "bot" || m.content?.type !== "div")); // remove spinner
        setBotMessages(prev => [...prev, {
          id: Date.now(),
          from: "user",
          content: `📍 GPS: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
        }]);
        pushBotMessage(
          <div className="space-y-1">
            <p>📍 Location confirmed via GPS!</p>
            <p className="text-slate-600">Now <strong>attach photos or videos</strong> of the issue (up to 5), or tap <em>Skip</em> to continue.</p>
          </div>
        );
        setBotStep("askMedia");
      },
      () => {
        setBotMessages(prev => prev.filter(m => m.from !== "bot" || m.content?.type !== "div"));
        pushBotMessage(<p className="text-red-500">⚠️ Could not get GPS. Please type your area name instead.</p>);
      },
      { timeout: 8000 }
    );
  };

  /* ── Bot: media upload ── */
  const handleBotMediaUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_MEDIA - botMediaFiles.length;
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const entry = { url: reader.result, base64: reader.result, type: file.type.startsWith("video/") ? "video" : "image", name: file.name };
        setBotMediaFiles(prev => {
          const updated = [...prev, entry];
          setBotMessages(pm => [...pm, {
            id: Date.now() + Math.random(),
            from: "user",
            content: entry.type === "image"
              ? <img src={entry.url} alt={entry.name} className="rounded-xl max-h-40 w-auto object-cover border border-emerald-100" />
              : <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2"><Video className="h-4 w-4 text-amber-500" /><span className="text-xs text-amber-700">{entry.name}</span></div>
          }]);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeBotMedia = (idx) => setBotMediaFiles(prev => prev.filter((_, i) => i !== idx));

  /* ── Bot: restart ── */
  const handleBotRestart = () => {
    setBotMessages([]);
    setBotStep("welcome");
    setBotName(""); setBotEmail(""); setBotLocation(null);
    setBotMediaFiles([]); setBotIssue(""); setBotSubmitted(false); setBotInput("");
    setTimeout(() => {
      setBotMessages([{
        id: "bot-welcome-2",
        from: "bot",
        content: (
          <div className="space-y-1.5">
            <p>👋 <strong>Welcome back to NagarSetu!</strong></p>
            <p className="text-slate-600">Let's log another report. What's your <strong>full name</strong>?</p>
          </div>
        )
      }]);
      setBotStep("askName");
    }, 100);
  };

  /* ── Voice Typing ── */
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      window.speechRecognitionInstance?.stop();
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    window.speechRecognitionInstance = recognition;
    recognition.lang = 'en-IN'; 
    recognition.continuous = true;
    recognition.interimResults = true;
    
    const existingText = botInput;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setBotInput(existingText ? existingText + ' ' + currentTranscript : currentTranscript);
    };
    recognition.onerror = (event) => {
      console.error(event.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.start();
  };

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center font-sans w-full max-w-lg mx-auto">
      
      {/* Phone frame */}
      <div className="bg-slate-900 rounded-[40px] p-4 shadow-2xl border-8 border-slate-800 relative flex flex-col w-full" style={{ height: '80vh', minHeight: 650, maxHeight: 850 }}>
        
        {/* Notch */}
        <div className="w-28 h-5 bg-slate-800 rounded-full mx-auto mb-4 relative flex items-center justify-center z-10 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-slate-950 absolute left-4 border border-white/10" />
          <span className="w-10 h-1.5 bg-slate-950 rounded-full border border-white/10" />
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#075e54] text-white px-4 py-3 rounded-t-[20px] flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-[11px] font-bold shadow-inner">NS</div>
            <div>
              <div className="text-sm font-bold tracking-wide">NagarSetu Bot</div>
              <div className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                Online · Civic Assistant
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Video className="h-5 w-5 text-emerald-100 cursor-pointer hover:text-white transition-colors" />
            <Phone className="h-5 w-5 text-emerald-100 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        {/* WhatsApp chat wallpaper + messages */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-sm relative"
          style={{
            background: "#e5ddd5",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c7b8a8' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        >
          {/* Date chip */}
          <div className="text-center mb-2">
            <span className="bg-[#e1f2fb]/90 text-[#5a8fa3] text-[10px] px-3 py-1 rounded-lg font-medium shadow-sm border border-slate-200/50">
              Today
            </span>
          </div>

          {botMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "bot" ? "justify-start" : "justify-end"}`}>
              {msg.from === "bot"
                ? <BotBubble>{msg.content}</BotBubble>
                : <UserBubble>{msg.content}</UserBubble>
              }
            </div>
          ))}

          {botTyping && (
            <div className="flex justify-start">
              <BotBubble typing />
            </div>
          )}
          <div ref={botChatEndRef} />
        </div>

        {/* Media preview strip (above input) */}
        {botMediaFiles.length > 0 && (
          <div className="bg-[#075e54]/10 border-t border-slate-300/30 px-3 py-2 flex gap-2 flex-wrap">
            {botMediaFiles.map((f, i) => (
              <div key={i} className="relative group">
                {f.type === "image"
                  ? <img src={f.url} alt="" onClick={() => setLightboxMedia(f)} className="h-12 w-12 object-cover rounded-lg border border-white/80 cursor-pointer hover:opacity-80 transition-opacity shadow-sm" />
                  : <div className="h-12 w-12 bg-slate-700 rounded-lg border border-white/80 flex items-center justify-center shadow-sm"><Video className="h-5 w-5 text-amber-400" /></div>
                }
                <button onClick={() => removeBotMedia(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar area */}
        <div className="bg-[#f0f0f0] rounded-b-[20px] px-2 py-2.5 flex items-center gap-2 border-t border-slate-300/40 relative z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          
          {/* Main Input Box */}
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2 border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-emerald-500 transition-shadow">
            
            {/* Contextual Action (Left side of input) */}
            {botStep === "askMedia" && !botSubmitted ? (
              <>
                <input ref={botFileRef} type="file" accept="image/*,video/*" multiple onChange={handleBotMediaUpload} className="hidden" id="bot-media" />
                <label htmlFor="bot-media" className="cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors shrink-0" title="Attach photo/video">
                  <ImageIcon className="h-5 w-5" />
                </label>
              </>
            ) : botStep === "askLocation" && !botSubmitted ? (
              <button onClick={handleBotGPS} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Use GPS">
                <Navigation className="h-5 w-5" />
              </button>
            ) : null}

            <input
              value={botInput}
              onChange={e => setBotInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleBotSend(); } }}
              placeholder={
                botSubmitted ? "Report submitted ✅" :
                botStep === "askName" ? "Type your full name…" :
                botStep === "askEmail" ? "Type your email address…" :
                botStep === "askLocation" ? "Type area name or use 📍 GPS…" :
                botStep === "askMedia" ? "Tap 🖼 to attach, or Skip…" :
                botStep === "askIssue" ? "Describe the issue…" : "Type a message…"
              }
              disabled={botSubmitted}
              className="flex-1 bg-transparent text-[13px] outline-none text-slate-700 placeholder:text-slate-400"
            />

            {/* Skip button for media step */}
            {botStep === "askMedia" && !botSubmitted && (
              <button onClick={() => { setBotInput("skip"); handleBotSend(); setBotInput(""); }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-1 whitespace-nowrap">
                Skip
              </button>
            )}

            {/* Voice Typing Button */}
            {!botSubmitted && (
              <button onClick={toggleRecording} className={`transition-colors shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-emerald-600'}`} title="Voice Typing">
                {isRecording ? <Mic className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleBotSend}
            disabled={botSubmitted || (!botInput.trim() && botStep !== "askMedia")}
            className="w-11 h-11 bg-[#00a884] hover:bg-[#008f6f] disabled:bg-[#a5d6cc] rounded-full flex items-center justify-center transition-colors shrink-0 shadow-md transform hover:scale-105 active:scale-95">
            <Send className="h-5 w-5 text-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Restart action - Always Available */}
      <div className="mt-8 flex justify-center relative z-10 w-full max-w-sm mx-auto">
        <button onClick={handleBotRestart}
          className="group relative inline-flex items-center justify-center w-full px-8 py-3.5 text-sm font-bold text-slate-300 transition-all duration-300 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full hover:text-white hover:bg-slate-800 hover:border-slate-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden">
          <span className="absolute inset-0 w-full h-full rounded-full opacity-30 bg-gradient-to-b from-transparent via-transparent to-slate-800 pointer-events-none"></span>
          <span className="relative flex items-center gap-2.5">
            <svg className="w-4 h-4 text-emerald-400 transition-transform group-hover:-rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start New Conversation
          </span>
        </button>
      </div>

      {/* ── Lightbox ── */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <button className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
          {lightboxMedia.type === "image"
            ? <img src={lightboxMedia.url} alt="Preview" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain border border-white/10" onClick={e => e.stopPropagation()} />
            : <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()} />
          }
        </div>
      )}
    </div>
  );
}