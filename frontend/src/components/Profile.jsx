import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Camera, User, Lock, Mail, Save, X, ArrowLeft, Check } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('auth/me/');
      setProfile(res.data);
      setFirstName(res.data.first_name || '');
      setLastName(res.data.last_name || '');
      setEmail(res.data.email || '');
      setAvatarPreview(res.data.avatar_url || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'Empty ⚪', color: 'var(--text-muted)', score: 0, text: 'No Password Entered', criteria: {} };
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (strength.score < 2) {
        setError('Please choose a stronger password.');
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      if (password) formData.append('password', password);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await API.patch('auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update avatarUrl in localStorage if updated
      if (res.data.avatar_url) {
        localStorage.setItem('avatarUrl', res.data.avatar_url);
      }

      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      fetchProfile();
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  return (
    <div className="main-content">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', cursor: 'pointer', background: 'none', border: 'none' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Manage your account settings and preferences</p>

        {/* Avatar Section */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '3px solid var(--primary)',
            }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={40} color="white" />
              }
            </div>
            <label htmlFor="avatar-upload" style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--primary)',
              borderRadius: '50%',
              padding: '0.3rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Camera size={14} color="white" />
            </label>
            <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{profile.username}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{profile.email}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Click the camera icon to change avatar</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--success)', fontSize: '0.9rem' }}>
              ✅ {success}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Mail size={14} /> Email Address
              </label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} /> Change Password
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Leave blank to keep your current password.</p>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" />
                
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
                        {strength.criteria.length ? '✓' : '✗'} At least 6 characters
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.mixedCase ? 'var(--success)' : 'var(--text-muted)' }}>
                        {strength.criteria.mixedCase ? '✓' : '✗'} Mixed case (A, a)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.number ? 'var(--success)' : 'var(--text-muted)' }}>
                        {strength.criteria.number ? '✓' : '✗'} Has numbers (0-9)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: strength.criteria.symbol ? 'var(--success)' : 'var(--text-muted)' }}>
                        {strength.criteria.symbol ? '✓' : '✗'} Has symbols (#, $, @)
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                {confirmPassword && password !== confirmPassword && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>❌ Passwords do not match</span>
                )}
                {confirmPassword && password === confirmPassword && password.length > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px', display: 'block' }}>✅ Passwords match</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                <X size={16} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
