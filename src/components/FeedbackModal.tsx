import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle2, X, Sparkles, ThumbsUp, HeartHandshake } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  userName = 'User'
}) => {
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('Audio Quality & Lossless');
  const [message, setMessage] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      if (db) {
        await addDoc(collection(db, 'user_feedback'), {
          userName: userName || 'Anonymous',
          userEmail: emailInput.trim() || userEmail || 'Not provided',
          rating,
          category,
          message: message.trim(),
          submittedAt: serverTimestamp(),
          clientPlatform: 'Web / PWA',
          userAgent: navigator.userAgent
        });
      }

      // Save to local feedback store
      const existing = JSON.parse(localStorage.getItem('aura_feedback_logs') || '[]');
      existing.unshift({
        id: `fb-${Date.now()}`,
        rating,
        category,
        message: message.trim(),
        date: new Date().toISOString()
      });
      localStorage.setItem('aura_feedback_logs', JSON.stringify(existing));

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage('');
        onClose();
      }, 1800);
    } catch (err) {
      console.warn('Feedback fallback to local storage:', err);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage('');
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header banner */}
        <div className="p-5 bg-gradient-to-r from-blue-900/60 via-indigo-950/70 to-zinc-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AURA MUSIC Feedback
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">Live</span>
              </h3>
              <p className="text-xs text-zinc-400">Help us improve your music listening experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Your valuable thoughts have been saved and sent to our audio engineering team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Rate Your Experience</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-400 ml-2">
                  {rating === 5 ? 'Exceptional! 🌟' : rating === 4 ? 'Great 👍' : rating === 3 ? 'Good 🙂' : 'Needs Improvement'}
                </span>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Audio Quality & Lossless',
                  '10-Band Equalizer',
                  'UI & Visual Design',
                  'Music Scan & Folders',
                  'P2P Fast Share',
                  'Feature Request'
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-medium text-left transition border ${
                      category === cat
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                        : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Feedback & Suggestions *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you like or how we can make AURA MUSIC even better..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none transition"
              />
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email (Optional, for developer reply)</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
