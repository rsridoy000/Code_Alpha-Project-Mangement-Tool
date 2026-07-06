import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Plus, Users, Folder, ChevronRight, BarChart2, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await API.get('auth/me/');
      setCurrentUser(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await API.get('projects/');
      setProjects(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await API.get('auth/users/');
      const currentId = localStorage.getItem('userId');
      setAllUsers(response.data.filter(u => u.id.toString() !== currentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('projects/', {
        name,
        description,
        members: selectedMembers,
      });
      setProjects([...projects, response.data]);
      setShowModal(false);
      setName('');
      setDescription('');
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await API.delete(`projects/${projectId}/`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  // Calculate global stats across all projects
  const getGlobalStats = () => {
    let total = 0, completed = 0, inProgress = 0, highPriority = 0;
    projects.forEach(p => {
      if (!p.lists) return;
      p.lists.forEach((list) => {
        const lname = list.name.toLowerCase();
        list.tasks && list.tasks.forEach(task => {
          total++;
          if (lname.includes('done') || lname.includes('completed') || lname.includes('complete')) {
            completed++;
          } else if (lname.includes('progress')) {
            inProgress++;
          }
          if (task.priority === 'HIGH') highPriority++;
        });
      });
    });
    return { total, completed, inProgress, highPriority };
  };

  const getProjectProgress = (project) => {
    if (!project.lists || project.lists.length === 0) return 0;
    let total = 0, done = 0;
    project.lists.forEach((list) => {
      const lname = list.name.toLowerCase();
      total += list.tasks ? list.tasks.length : 0;
      if (lname.includes('done') || lname.includes('completed') || lname.includes('complete')) {
        done += list.tasks ? list.tasks.length : 0;
      }
    });
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  const getPriorityColorForStat = (val, max) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    if (pct > 66) return 'var(--danger)';
    if (pct > 33) return 'var(--warning)';
    return 'var(--accent)';
  };

  const stats = getGlobalStats();

  return (
    <div className="main-content">
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Workspace Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and track all collaborative projects</p>
        </div>
        {currentUser?.is_manager && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Tasks', value: stats.total, icon: <BarChart2 size={20} />, color: 'var(--primary)' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle size={20} />, color: 'var(--success)' },
          { label: 'In Progress', value: stats.inProgress, icon: <Clock size={20} />, color: 'var(--warning)' },
          { label: 'High Priority', value: stats.highPriority, icon: <AlertCircle size={20} />, color: 'var(--danger)' },
          { label: 'Projects', value: projects.length, icon: <Folder size={20} />, color: 'var(--accent)' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              <div style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      {stats.total > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📊 Overall Workspace Progress</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round((stats.completed / stats.total) * 100)}%</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.round((stats.completed / stats.total) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              borderRadius: '5px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>{stats.completed} completed</span>
            <span>{stats.total - stats.completed} remaining</span>
          </div>
        </div>
      )}

      {/* Projects Section */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>Your Projects ({projects.length})</h2>
      <div className="project-grid">
        {projects.map((project) => {
          const progress = getProjectProgress(project);
          const totalTasks = project.lists ? project.lists.reduce((sum, l) => sum + (l.tasks ? l.tasks.length : 0), 0) : 0;
          return (
            <div key={project.id} className="project-card glass-card" onClick={() => navigate(`/projects/${project.id}`)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'var(--primary-glow)', borderRadius: '8px', color: 'var(--accent)' }}>
                      <Folder size={20} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{project.name}</h3>
                  </div>
                  {(currentUser?.is_manager || project.owner === currentUser?.id) && (
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description || 'No description provided.'}
                </p>

                {/* Per-project progress bar */}
                {totalTasks > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Progress</span><span style={{ color: 'var(--accent)' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Users size={14} />
                    <span>{project.members_detail ? project.members_detail.length : 1}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <BarChart2 size={14} />
                    <span>{totalTasks} tasks</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {projects.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No projects yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {currentUser?.is_manager 
                ? 'Create your first project to get started with your team!'
                : 'Ask your manager to assign you to a project to get started!'
              }
            </p>
            {currentUser?.is_manager && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Create First Project</button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>🚀 Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Website Redesign" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ minHeight: '90px', resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
              </div>
              <div className="form-group">
                <label className="form-label">Add Members</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {allUsers.map((user) => (
                    <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.25rem' }}>
                      <input type="checkbox" checked={selectedMembers.includes(user.id)} onChange={() => toggleMemberSelection(user.id)} style={{ accentColor: 'var(--primary)' }} />
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </label>
                  ))}
                  {allUsers.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No other registered users.</span>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={18} /> Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
