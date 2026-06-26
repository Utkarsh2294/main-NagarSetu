import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/user/${userId}/notifications`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/user/${userId}/notifications/${id}/read`, { method: "PATCH" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 rounded-full border border-slate-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 cursor-pointer transition-colors ${n.read ? 'bg-slate-900/50 hover:bg-slate-800/50' : 'bg-slate-800/80 hover:bg-slate-700/80'}`}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                      <div>
                        <div className={`text-sm ${n.read ? 'text-slate-300' : 'text-white font-bold'}`}>
                          {n.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 font-mono">
                          {new Date(n.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
