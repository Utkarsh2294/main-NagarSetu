import { useState } from "react";
import { Send, Phone, MessageSquare, MapPin, ImageIcon, ArrowRight } from "lucide-react";
const TEMPLATES = [
  {
    message: "pothole on 100 feet road indiranagar near metro",
    category: "Roads & Potholes",
    coords: { lat: 12.9712, lng: 77.6405 },
    photo: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80"
  },
  {
    message: "heavy water leak and sewage flooding on residency road",
    category: "Sewage & Water Leak",
    coords: { lat: 12.9698, lng: 77.5982 },
    // will trigger deduplication check because we have seeded Issue 4 here!
    photo: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=600&q=80"
  },
  {
    message: "garbage dumped illegally near indiranagar park corner",
    category: "Garbage & Sanitation",
    coords: { lat: 12.9754, lng: 77.6412 },
    // will trigger duplicate merge with issue_hotspot_1!
    photo: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"
  },
  {
    message: "two street lights are completely broken on koramangala 80 feet road",
    category: "Street Lights",
    coords: { lat: 12.934, lng: 77.6195 },
    photo: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=600&q=80"
  }
];
export default function WhatsAppSimulator({
  onSimulateReport,
  whatsappMessages,
  loading
}) {
  const [sender, setSender] = useState("+91 94450 12345");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const handleSelectTemplate = (index) => {
    setSelectedTemplateIndex(index);
    setCustomMessage(TEMPLATES[index].message);
    setSelectedPhoto(TEMPLATES[index].photo);
    setPhotoBase64("");
  };
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedTemplateIndex(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPhotoBase64(base64String);
      setSelectedPhoto(base64String);
    };
    reader.readAsDataURL(file);
  };
  const handleSend = async () => {
    if (!customMessage.trim()) return;
    let lat = 12.9716 + (Math.random() - 0.5) * 0.02;
    let lng = 77.5946 + (Math.random() - 0.5) * 0.02;
    if (selectedTemplateIndex !== null) {
      lat = TEMPLATES[selectedTemplateIndex].coords.lat;
      lng = TEMPLATES[selectedTemplateIndex].coords.lng;
    }
    await onSimulateReport({
      sender,
      message: customMessage,
      lat,
      lng,
      imageBase64: photoBase64 || void 0
    });
    setCustomMessage("");
    setSelectedTemplateIndex(null);
    setPhotoBase64("");
    setSelectedPhoto("");
  };
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {
    /* Left Columns: Simulator Controls */
  }
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              WhatsApp Reporting Simulation
            </h3>
            <p className="text-xs text-slate-400">
              Simulate citizens filing reports instantly on the go via the Twilio WhatsApp webhook channel.
            </p>
          </div>

          {
    /* Sender inputs */
  }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Citizen Phone Number
              </label>
              <input
    type="text"
    value={sender}
    onChange={(e) => setSender(e.target.value)}
    className="w-full text-sm bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:bg-slate-800 rounded-xl px-4.5 py-3 outline-none font-mono text-slate-200 transition-all"
    placeholder="+91 94450 12345"
  />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Image Attachment
              </label>
              <div className="flex items-center gap-3">
                <input
    type="file"
    accept="image/*"
    onChange={handlePhotoUpload}
    id="wa-photo-upload"
    className="hidden"
  />
                <label
    htmlFor="wa-photo-upload"
    className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer transition-all"
  >
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  {photoBase64 ? "Custom Attached" : "Attach Photo"}
                </label>
              </div>
            </div>
          </div>

          {
    /* Template triggers */
  }
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Preset Report Templates
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {TEMPLATES.map((tpl, idx) => <button
    key={idx}
    onClick={() => handleSelectTemplate(idx)}
    className={`text-left p-3.5 rounded-xl border text-xs transition-all space-y-1 ${selectedTemplateIndex === idx ? "bg-emerald-900/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-900" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800/80"}`}
  >
                  <div className="font-bold flex items-center justify-between text-slate-100">
                    <span>{tpl.category}</span>
                    {selectedTemplateIndex === idx && <span className="text-[10px] text-emerald-400 font-semibold font-mono">SELECTED</span>}
                  </div>
                  <p className="line-clamp-2 text-slate-400 italic">"{tpl.message}"</p>
                </button>)}
            </div>
          </div>

          {
    /* Draft text message container */
  }
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Message text
            </label>
            <div className="flex gap-2">
              <input
    type="text"
    value={customMessage}
    onChange={(e) => {
      setCustomMessage(e.target.value);
      setSelectedTemplateIndex(null);
    }}
    className="flex-1 text-sm bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:bg-slate-800 rounded-xl px-4.5 py-3 outline-none text-slate-200 transition-all"
    placeholder="Type simulated WhatsApp report message..."
  />
              <button
    onClick={handleSend}
    disabled={loading || !customMessage.trim()}
    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 flex items-center justify-center disabled:opacity-40 transition-colors shadow-md shadow-emerald-600/10"
  >
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {
    /* Attachment Preview */
  }
          {selectedPhoto && <div className="border border-slate-700 rounded-xl p-3 flex items-center gap-3 bg-slate-800/50">
              <img
    src={selectedPhoto}
    alt="Attachment preview"
    className="h-14 w-14 object-cover rounded-lg border border-slate-700"
  />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-200">Photo Attachment Loaded</div>
                <div className="text-[10px] text-slate-400">Will be processed via the categorization pipeline.</div>
              </div>
            </div>}
        </div>
      </div>

      {
    /* Right Column: Simulated Phone Frame containing Whatsapp Logs */
  }
      <div className="bg-slate-950 rounded-[36px] p-4.5 shadow-2xl border-4 border-slate-800 relative min-h-[500px] flex flex-col">
        {
    /* Notch / Speaker bar */
  }
        <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 relative flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute left-4" />
          <span className="w-8 h-1 bg-slate-900 rounded-full" />
        </div>

        {
    /* WhatsApp App Header mock */
  }
        <div className="bg-emerald-800 text-white p-3 rounded-t-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
              NS
            </div>
            <div>
              <div className="text-xs font-bold">NagarSetu Bot</div>
              <div className="text-[9px] text-emerald-200">Online · Verification Assistant</div>
            </div>
          </div>
          <Phone className="h-4 w-4 text-emerald-100" />
        </div>

        {
    /* WhatsApp Chats Container */
  }
        <div className="flex-1 bg-[#efeae2] p-3 overflow-y-auto space-y-3.5 flex flex-col text-xs font-sans max-h-[380px]">
          {whatsappMessages.length === 0 ? <div className="my-auto text-center space-y-2 px-4 text-slate-400">
              <MessageSquare className="h-8 w-8 mx-auto opacity-30 text-slate-500" />
              <p className="text-[11px] leading-relaxed">
                No simulated messages yet. Send a message on the left to see the instant live mapping feed!
              </p>
            </div> : whatsappMessages.map((msg) => <div key={msg.id} className="space-y-1.5">
                {
    /* Citizen Message Bubble (Outgoing) */
  }
                <div className="self-end bg-[#d9fdd3] text-slate-800 rounded-xl rounded-tr-none px-3 py-2 shadow-sm max-w-[85%] ml-auto relative">
                  <div className="text-[9px] text-emerald-700 font-bold font-mono mb-0.5">{msg.sender}</div>
                  {msg.photoUrl && <img
    src={msg.photoUrl}
    alt="Citizen Attach"
    className="rounded-lg mb-1.5 border border-emerald-100 max-h-32 w-full object-cover"
  />}
                  <p className="text-slate-700 italic">"{msg.message}"</p>
                  <div className="flex items-center gap-1 justify-end text-[9px] text-slate-400 mt-1">
                    <MapPin className="h-2.5 w-2.5" />
                    <span> Bengaluru ({msg.lat.toFixed(4)}, {msg.lng.toFixed(4)})</span>
                  </div>
                </div>

                {
    /* Bot Response Bubble (Incoming) */
  }
                <div className="self-start bg-white text-slate-800 rounded-xl rounded-tl-none px-3 py-2 shadow-sm max-w-[85%] mr-auto relative space-y-1.5">
                  <div className="text-[9px] text-indigo-600 font-bold">NagarSetu AI Bot</div>
                  <p className="text-slate-600">
                    🚨 <strong>Ticket Logged!</strong> Thank you for reporting this issue. Our pipeline has processed your report:
                  </p>
                  <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-lg text-[10px] space-y-0.5 font-mono text-slate-600">
                    <div>• <strong>Status:</strong> New (Reported)</div>
                    <div>• <strong>Auto Classify:</strong> Heuristics Match</div>
                    <div>• <strong>Mapped:</strong> Live Map Pin Updated</div>
                  </div>
                  <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span>View live on Active Map!</span>
                  </div>
                </div>
              </div>)}
        </div>

        {
    /* WhatsApp Footer Text entry Mock */
  }
        <div className="bg-slate-900 p-2.5 rounded-b-2xl flex items-center gap-2 mt-auto border-t border-slate-800">
          <div className="flex-1 bg-slate-800 rounded-full px-3 py-1.5 text-slate-400 text-[10px] italic">
            Simulated twilio-whatsapp-gateway...
          </div>
          <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white">
            <Send className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>;
}
