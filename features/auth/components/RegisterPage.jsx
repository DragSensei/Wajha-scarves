import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/shared/lib/api';

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Register the user
      await api.register({
        email,
        password,
        full_name: fullName,
        phone,
        role: 'student' // default storefront customer role
      });

      // 2. Automatically log them in after registration
      const loginData = await api.login(email, password);
      if (loginData.user) {
        onLoginSuccess(loginData.user);
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif text-primary uppercase font-bold mb-3 tracking-widest">
          Create Account
        </h1>
        <p className="text-xs font-sans tracking-widest text-outline uppercase">
          Join Diya Silk Scarves
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
            Full Name
          </label>
          <input 
            type="text" 
            required 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Ahmed" 
            className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
          />
        </div>

        <div className="border-b border-outline/30 pb-2">
          <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
            Email Address
          </label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@example.com" 
            className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
          />
        </div>

        <div className="border-b border-outline/30 pb-2">
          <label className="block text-[10px] font-sans tracking-widest uppercase text-outline mb-1">
            Phone Number
          </label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 890" 
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
            placeholder="Min. 8 characters" 
            className="w-full text-sm font-sans bg-transparent focus:outline-hidden text-on-background py-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-container text-white text-xs font-sans tracking-widest uppercase py-4 transition-colors font-medium"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className="text-center mt-6">
        <span className="text-xs text-outline font-sans">Already have an account? </span>
        <Link to="/login" className="text-xs text-primary font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
