import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Gift, Lock } from 'lucide-react';
import { api } from '@/shared/lib/api';

export default function BirthdateOnboarding({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user || user.birth_date) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!birthDate) {
      setError("Please select your date of birth.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.updateProfile({ birth_date: birthDate });
      if (res && res.user) {
        if (onUserUpdate) onUserUpdate(res.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || "Failed to update date of birth. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white border border-surface-container p-8 shadow-xl text-center space-y-6 animate-fadeIn">
        <div className="inline-flex p-4 bg-primary/10 rounded-full text-primary mb-2">
          <Gift className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-serif text-primary uppercase font-bold tracking-widest mb-2">
            Date of Birth Required
          </h1>
          <p className="text-xs font-sans tracking-wider text-outline uppercase">
            Complete your profile to unlock member birthday rewards
          </p>
        </div>

        <p className="text-xs font-sans text-on-background/80 leading-relaxed">
          Hello <strong className="font-semibold">{user?.full_name || 'Member'}</strong>! To ensure a personalized shopping experience and unlock tier birthday gifts, please provide your date of birth below.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-sans p-3 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="border-b border-outline/30 pb-2">
            <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1 cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-amber-800 bg-amber-50 p-2.5 border border-amber-200 rounded">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Note: Once submitted, your date of birth cannot be modified to prevent reward gaming.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-4 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving Date of Birth...' : 'Submit & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
