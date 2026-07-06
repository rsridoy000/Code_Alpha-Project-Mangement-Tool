import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { Check, X, Shield, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Enforce at least medium password strength
    const strength = getPasswordStrength(password);
    if (strength.score < 2) {
      setError('Please choose a stronger password.');
      return;
    }

    try {
      await API.post('auth/register/', { username, email, password });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Username might be taken.');
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'Empty ⚪', color: 'var(--text-muted)', score: 0, text: 'No Password Entered', desc: 'পাসওয়ার্ড দিন' };
    
    const criteria = {
      length: pass.length >= 6,
      mixedCase: /[a-z]/.test(pass) && /[A-Z]/.test(pass),
      number: /\d/.test(pass),
      symbol: /\W/.test(pass),
    };

    let score = 0;
    if (criteria.length) score += 1;
    if (criteria.mixedCase) score += 1;
    if (criteria.number) score += 1;
    if (criteria.symbol) score += 1;

    let label = 'Weak 🔴';
    let color = 'var(--danger)';
    let text = 'Weak (দুর্বল)';
    
    if (score === 2 || score === 3) {
      label = 'Medium 🟡';
      color = 'var(--warning)';
      text = 'Medium (মাঝারি)';
    } else if (score === 4) {
      label = 'Strong 🟢';
      color = 'var(--success)';
      text = 'Nice & Strong (খুবই সুন্দর/শক্তিশালী)';
    }

    return { label, color, score, text, criteria };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 800, fontSize: '1.75rem' }}>Create Account</h2>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239,68,68,0.08)', padding: '0.5rem 1rem', borderRadius: '8px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choose a username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a strong password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {password && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security Level:</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: strength.color }}>{strength.text}</span>
                </div>
                
                {/* Visual score bars */}
                <div style={{ display: 'flex', gap: '4px', height: '6px', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        flexGrow: 1,
                        borderRadius: '3px',
                        background: step <= strength.score ? strength.color : 'rgba(255,255,255,0.05)',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Validation checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.length ? 'var(--success)' : 'var(--text-muted)' }}>
                    {strength.criteria.length ? <Check size={12} /> : <X size={12} />} At least 6 characters
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.mixedCase ? 'var(--success)' : 'var(--text-muted)' }}>
                    {strength.criteria.mixedCase ? <Check size={12} /> : <X size={12} />} Mixed case (A, a)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.number ? 'var(--success)' : 'var(--text-muted)' }}>
                    {strength.criteria.number ? <Check size={12} /> : <X size={12} />} Has numbers (0-9)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.symbol ? 'var(--success)' : 'var(--text-muted)' }}>
                    {strength.criteria.symbol ? <Check size={12} /> : <X size={12} />} Has symbols (#, $, @)
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} /> Register
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
