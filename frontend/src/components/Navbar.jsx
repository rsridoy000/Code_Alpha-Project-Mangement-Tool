import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, FolderKanban, Settings } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const avatarUrl = localStorage.getItem('avatarUrl');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FolderKanban size={28} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>CollabFlow</h2>
      </Link>
      {token ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* User Avatar & Name */}
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid var(--primary)',
              flexShrink: 0,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                    {username ? username[0].toUpperCase() : '?'}
                  </span>
              }
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{username}</span>
            <Settings size={15} style={{ color: 'var(--text-muted)' }} />
          </Link>

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Login</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Register</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
