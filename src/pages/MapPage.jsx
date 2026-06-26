import { useState, useEffect, useRef } from "react";
import NagarMap from "../components/NagarMap";
import { Camera, MapPin, Send, AlertTriangle, ShieldCheck, CheckCircle2, ChevronLeft, Eye, EyeOff, X, Mic } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const AI_STATUS_COPY = {
  idle: "",
  analyzing: "Analyzing image...",
  complete: "Analysis complete",
  temporarily_unavailable: "AI service temporarily unavailable",
  rate_limited: "AI service temporarily unavailable",
  not_configured: "AI service temporarily unavailable",
  failed: "AI service temporarily unavailable"
};

export default function MapPage({ currentUser, onLoginClick }) {
  const { t } = useLanguage();
  const [issues, setIssues] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [showHotspots, setShowHotspots] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);
  const [newReportCoords, setNewReportCoords] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [gpsSource, setGpsSource] = useState("Loading...");
  const [reportCategory, setReportCategory] = useState("Roads & Potholes");
  const [reportDescription, setReportDescription] = useState("");
  const [reportMedia, setReportMedia] = useState([]);
  const [address, setAddress] = useState("Fetching address...");
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      window.mapSpeechRecognitionInstance?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    window.mapSpeechRecognitionInstance = recognition;
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Capture the existing text when recording starts
    const existingText = reportDescription;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setReportDescription(existingText ? existingText + ' ' + currentTranscript : currentTranscript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  useEffect(() => {
    fetchIssues();
    fetchHotspots();
    const iv = setInterval(fetchIssues, 3e4);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if ("geolocation" in navigator) {
      setGpsSource("Browser GPS");
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error(err);
          setGpsSource("Default (Bengaluru)");
          setUserCoords({ lat: 12.9716, lng: 77.5946 });
        }
      );
    } else {
      setGpsSource("Default (Bengaluru)");
      setUserCoords({ lat: 12.9716, lng: 77.5946 });
    }
  }, []);
  useEffect(() => {
    if (selectedIssueId) {
      fetch(`/api/issues/${selectedIssueId}`).then((r) => r.json()).then((d) => setSelectedIssueDetail(d)).catch(console.error);
    } else {
      setSelectedIssueDetail(null);
    }
  }, [selectedIssueId, issues]);

  useEffect(() => {
    if (newReportCoords) {
      setAddress("Fetching address...");
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newReportCoords.lat}&lon=${newReportCoords.lng}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress("Address not found");
          }
        })
        .catch(() => setAddress("Failed to fetch address"));
    }
  }, [newReportCoords]);
  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      const data = await res.json();
      setIssues(data);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchHotspots = async () => {
    try {
      const res = await fetch("/api/hotspots");
      const data = await res.json();
      setHotspots(data);
    } catch (e) {
      console.error(e);
    }
  };
  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (reportMedia.length + files.length > 5) {
      alert("You can upload a maximum of 5 photos/videos.");
      return;
    }

    files.forEach(file => {
      const type = file.type?.startsWith("video/") ? "video" : "image";
      const previewUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportMedia(prev => [...prev, { file, type, previewUrl, base64: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setReportMedia(prev => prev.filter((_, i) => i !== index));
  };
  const handleSubmitReport = async () => {
    if (!newReportCoords || !currentUser) return;
    setIsSubmitting(true);
    setAnalysisStatus(reportMedia.length > 0 ? "analyzing" : "idle");
    setAnalysisMessage(reportMedia.length > 0 ? AI_STATUS_COPY.analyzing : "");
    try {
      let mediaList = [];
      if (reportMedia.length > 0) {
        mediaList = await Promise.all(reportMedia.map(async (media) => {
          const uploadRes = await fetch("/api/upload-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaBase64: media.base64, uid: currentUser.id })
          });
          const uploadData = await uploadRes.json();
          return {
            photoUrl: uploadData.photoUrl,
            mediaType: uploadData.mediaType || media.type
          };
        }));
      }

      const reportRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          mediaList,
          lat: newReportCoords.lat,
          lng: newReportCoords.lng,
          userCategory: reportCategory,
          userDescription: reportDescription
        })
      });
      const reportData = await reportRes.json();
      if (reportData.success) {
        const nextStatus = reportData.aiStatus === "complete" ? "complete" : (reportData.aiStatus || "temporarily_unavailable");
        setAnalysisStatus(nextStatus);
        setAnalysisMessage(nextStatus === "complete"
          ? AI_STATUS_COPY.complete
          : "AI analysis is temporarily unavailable. The report has been submitted successfully.");
        setNewReportCoords(null);
        setReportCategory("Roads & Potholes");
        setReportDescription("");
        setReportMedia([]);
        fetchIssues();
      } else {
        setAnalysisStatus("failed");
        setAnalysisMessage("Report submission failed. Please try again.");
        alert("Report submission failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setAnalysisStatus("failed");
      setAnalysisMessage("Report submission failed. Please try again.");
      alert("Report submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerify = async (type) => {
    if (!currentUser || !selectedIssueId) return;
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, issueId: selectedIssueId, type })
      });
      const data = await res.json();
      if (data.success) {
        fetchIssues();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleSimulateAgencyFix = async () => {
    if (!selectedIssueId) return;
    try {
      const res = await fetch("/api/agency/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId: selectedIssueId })
      });
      if (res.ok) fetchIssues();
    } catch (e) {
      console.error(e);
    }
  };
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const isWithinVerificationRange = selectedIssueDetail && userCoords ? getDistance(userCoords.lat, userCoords.lng, selectedIssueDetail.lat, selectedIssueDetail.lng) <= 500 : false;
  return <div className="flex flex-col h-screen pt-16">
      
      {
    /* Top GPS / Hotspot Bar */
  }
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between z-10 shrink-0 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full text-xs font-mono border border-slate-700">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            <span>{t("map.gps_label")}: {userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : "Locating..."}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {t("map.gps_source")}: <span className="text-emerald-500">{gpsSource}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
    onClick={() => setShowHotspots(!showHotspots)}
    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${showHotspots ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}
  >
            {showHotspots ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showHotspots ? t("map.hotspots_active") : t("map.hotspots_hidden")}
          </button>
        </div>
      </div>

      {
    /* Main Content Area */
  }
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {
    /* Sidebar Container */
  }
        <div className="w-full md:w-96 bg-slate-950 border-r border-slate-800 flex flex-col z-20 shrink-0 h-1/2 md:h-full overflow-hidden shadow-2xl transition-all">
          {analysisMessage && <div className={`mx-4 mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${analysisStatus === "complete" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : analysisStatus === "analyzing" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
              {analysisMessage}
            </div>}
          
          {
    /* Default List View */
  }
          {!newReportCoords && !selectedIssueId && <div className="flex flex-col h-full items-center justify-center p-8 bg-slate-900/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse">
                <MapPin className="h-10 w-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white font-display text-center mb-3">
                Raise Your Voice!
              </h2>
              <p className="text-slate-400 text-center max-w-[280px] leading-relaxed">
                <strong className="text-indigo-300">Tap anywhere on the map</strong> to drop a pin and report civic issues directly to the authorities.
              </p>
              
              <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Select an existing pin to view or verify it
              </div>
            </div>}

          {
    /* New Report Form */
  }
          {newReportCoords && <div className="flex flex-col h-full overflow-hidden bg-slate-900">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-white font-display text-lg">{t("map.report_title")}</h3>
                <button onClick={() => setNewReportCoords(null)} className="text-slate-400 hover:text-white p-1">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {currentUser && (
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    {currentUser.picture ? (
                      <img src={currentUser.picture} alt="Avatar" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                        {currentUser.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">{currentUser.name}</div>
                      <div className="text-xs text-slate-400">{currentUser.email || currentUser.phone}</div>
                    </div>
                  </div>
                )}

                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Location:</strong> {address} <br/>
                    <span className="opacity-70 text-[10px]">({newReportCoords.lat.toFixed(4)}, {newReportCoords.lng.toFixed(4)})</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("map.category_label")}</label>
                  <select
    value={reportCategory}
    onChange={(e) => setReportCategory(e.target.value)}
    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
  >
                    <option>{t("common.category_roads")}</option>
                    <option>{t("common.category_garbage")}</option>
                    <option>{t("common.category_lights")}</option>
                    <option>{t("common.category_water")}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("map.photo_label")} (Up to 5)</label>
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors bg-slate-800/50">
                    <input
    type="file"
    accept="image/*,video/*"
    multiple
    className="hidden"
    ref={fileInputRef}
    onChange={handlePhotoCapture}
  />
                    {reportMedia.length > 0 ? (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {reportMedia.map((media, idx) => (
                          <div key={idx} className="relative w-20 h-20 shrink-0">
                            {media.type === "video" ? (
                              <video src={media.previewUrl} className="w-full h-full object-cover rounded-lg border border-slate-600" />
                            ) : (
                              <img src={media.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg border border-slate-600" />
                            )}
                            <button
                              onClick={() => removeMedia(idx)}
                              className="absolute -top-2 -right-2 bg-rose-500 rounded-full p-1 text-white hover:bg-rose-600 shadow-md"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {reportMedia.length < 5 && (
                          <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-400 transition-colors bg-slate-800">
                            <Camera className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-indigo-400">
                          <Camera className="h-5 w-5" />
                        </div>
                        <p className="text-xs text-slate-400 cursor-pointer">{t("map.photo_hint")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("map.description_label")}</label>
                    <button onClick={toggleRecording} className={`transition-colors flex items-center gap-1 text-[10px] uppercase font-bold ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-indigo-400'}`}>
                      <Mic className="h-3 w-3" /> {isRecording ? "Recording..." : "Voice Type"}
                    </button>
                  </div>
                  <textarea
    value={reportDescription}
    onChange={(e) => setReportDescription(e.target.value)}
    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none h-24"
    placeholder={t("map.description_placeholder")}
  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3 shrink-0">
                <button onClick={() => setNewReportCoords(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                  {t("map.cancel")}
                </button>
                <button
    onClick={!currentUser ? onLoginClick : handleSubmitReport}
    disabled={isSubmitting}
    className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
  >
                  {isSubmitting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Send className="h-4 w-4" />}
                  {!currentUser ? "Sign in to Submit" : isSubmitting && reportMedia.length > 0 ? AI_STATUS_COPY.analyzing : t("map.submit")}
                </button>
              </div>
            </div>}

          {
    /* Issue Detail View */
  }
          {!newReportCoords && selectedIssueId && selectedIssueDetail && <div className="flex flex-col h-full overflow-hidden bg-slate-900">
              <div className="p-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
                <button onClick={() => setSelectedIssueId(null)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="font-bold text-white font-display text-lg truncate flex-1">{t("map.incident_summary")}</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {
    /* Meta header */
  }
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {selectedIssueDetail.category}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${selectedIssueDetail.status === "resolved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : selectedIssueDetail.status === "verified" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : selectedIssueDetail.status === "pending_fix_confirmation" ? "bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                    {selectedIssueDetail.status.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-slate-200 leading-relaxed text-sm bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  "{selectedIssueDetail.description}"
                </p>

                {selectedIssueDetail.aiMessage && selectedIssueDetail.aiStatus !== "complete" && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs font-semibold text-amber-300">
                    AI service temporarily unavailable
                  </div>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t("map.assigned_agency")}</div>
                    <div className="text-sm font-semibold text-slate-200 truncate" title={selectedIssueDetail.agencyName}>{selectedIssueDetail.agencyName}</div>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Reports Merged</div>
                    <div className="text-sm font-bold font-mono text-indigo-400">{selectedIssueDetail.reportCount}</div>
                  </div>
                </div>
                
                {selectedIssueDetail.StillBrokenCount > 0 && <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <div className="text-xs text-rose-200">
                      <strong className="text-rose-400">{t("map.reopened_count")}: {selectedIssueDetail.StillBrokenCount}</strong> — Citizens rejected the agency's fix claim.
                    </div>
                  </div>}

                {
    /* Proximity Meter for Actions */
  }
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 uppercase tracking-wider">{t("map.proximity")}</span>
                    {isWithinVerificationRange ? <span className="text-emerald-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t("map.in_range")}</span> : <span className="text-rose-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {t("map.too_far")}</span>}
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${isWithinVerificationRange ? "bg-emerald-500 w-full" : "bg-rose-500 w-1/4"}`} />
                  </div>
                  {!isWithinVerificationRange && <p className="text-[10px] text-slate-500">You must be within 500m to verify or audit this issue.</p>}
                </div>

                {
    /* Action Buttons based on Status */
  }
                {selectedIssueDetail.status === "reported" && <button
    onClick={() => handleVerify("confirm_exists")}
    disabled={!currentUser || !isWithinVerificationRange}
    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg border border-transparent"
  >
                    <CheckCircle2 className="h-5 w-5" />
                    {t("map.verify_exists")}
                  </button>}

                {selectedIssueDetail.status === "verified" && <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-3">Agency dashboard view simulation:</p>
                    <button
    onClick={handleSimulateAgencyFix}
    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-500"
  >
                      <ShieldCheck className="h-4 w-4" />
                      {t("map.agency_mark_fixed")}
                    </button>
                  </div>}

                {selectedIssueDetail.status === "pending_fix_confirmation" && <div className="space-y-3 bg-indigo-900/10 border border-indigo-500/30 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <ShieldCheck className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
                        <AlertTriangle className="h-4 w-4" /> {t("map.citizen_audit")}
                      </div>
                      <p className="text-xs text-slate-300 mb-4">{t("map.is_fixed_question")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
    onClick={() => handleVerify("confirm_fixed")}
    disabled={!currentUser || !isWithinVerificationRange}
    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-lg text-xs font-bold transition-colors border border-transparent"
  >
                          {t("map.confirm_fixed")}
                        </button>
                        <button
    onClick={() => handleVerify("still_broken")}
    disabled={!currentUser || !isWithinVerificationRange}
    className="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-lg text-xs font-bold transition-colors border border-transparent"
  >
                          {t("map.still_broken")}
                        </button>
                      </div>
                    </div>
                  </div>}

                {selectedIssueDetail.status === "resolved" && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h4 className="font-bold text-emerald-400 font-display">{t("map.resolved_title")}</h4>
                    <p className="text-xs text-slate-400">{t("map.resolved_desc")}</p>
                  </div>}

              </div>
            </div>}
        </div>

        {
    /* Map Container */
  }
        <div className="flex-1 relative h-1/2 md:h-full z-0">
          <NagarMap
    issues={issues}
    hotspots={hotspots}
    showHotspots={showHotspots}
    selectedIssueId={selectedIssueId}
    onSelectIssue={(id) => {
      setSelectedIssueId(id);
      setNewReportCoords(null);
    }}
    newReportCoords={newReportCoords}
    onSelectCoords={(c) => {
      setNewReportCoords(c);
      setSelectedIssueId(null);
    }}
    userCoords={userCoords}
  />
        </div>
      </div>
    </div>;
}
