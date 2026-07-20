import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/lib/api';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      if (data.user) {
        onLoginSuccess(data.user);
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif text-primary uppercase font-bold mb-3 tracking-widest">
          Sign In
        </h1>
        <p className="text-xs font-sans tracking-widest text-outline uppercase">
          Welcome back to Diya
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs font-sans p-4 mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b border-outline/30 pb-2">
          <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
            Email Address
          </label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com" 
            className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
          />
        </div>

        <div className="border-b border-outline/30 pb-2">
          <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
            Password
          </label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-4 transition-colors font-medium"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
