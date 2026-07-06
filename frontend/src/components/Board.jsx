import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import API from '../api';
import { 
  ArrowLeft, Plus, MessageSquare, User, Trash2, X, PlusCircle, 
  Calendar, AlertCircle, Paperclip, Activity, UserPlus, CheckSquare 
} from 'lucide-react';

const Board = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeListForNewTask, setActiveListForNewTask] = useState(null);
  
  // Member Invite
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Comments and Details
  const [commentText, setCommentText] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('LOW');
  const [selectedDueDate, setSelectedDueDate] = useState('');

  // UI Panels
  const [showActivityLog, setShowActivityLog] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await API.get(`projects/${id}/`);
      setProject(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceList = project.lists.find(list => list.id.toString() === source.droppableId);
    const destList = project.lists.find(list => list.id.toString() === destination.droppableId);
    const task = sourceList.tasks.find(t => t.id.toString() === draggableId);

    const updatedLists = project.lists.map(list => {
      if (list.id.toString() === source.droppableId) {
        return {
          ...list,
          tasks: list.tasks.filter(t => t.id.toString() !== draggableId)
        };
      }
      return list;
    });

    const targetList = updatedLists.find(list => list.id.toString() === destination.droppableId);
    const updatedTasks = [...targetList.tasks];
    updatedTasks.splice(destination.index, 0, { ...task, board_list: parseInt(destination.droppableId) });
    
    const finalLists = updatedLists.map(list => {
      if (list.id.toString() === destination.droppableId) {
        return { ...list, tasks: updatedTasks };
      }
      return list;
    });

    setProject({ ...project, lists: finalLists });

    try {
      await API.patch(`tasks/${draggableId}/`, {
        board_list: parseInt(destination.droppableId),
        order: destination.index
      });
      fetchProject();
    } catch (err) {
      console.error('Failed to update task position', err);
      fetchProject();
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const response = await API.post('lists/', {
        project: parseInt(id),
        name: newListName,
        order: project.lists.length
      });
      setProject({
        ...project,
        lists: [...project.lists, { ...response.data, tasks: [] }]
      });
      setNewListName('');
      setShowAddList(false);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const listId = activeListForNewTask;
    const targetList = project.lists.find(l => l.id === listId);
    try {
      const response = await API.post('tasks/', {
        board_list: listId,
        title: newTaskTitle,
        order: targetList.tasks.length,
        priority: 'LOW'
      });
      
      const updatedLists = project.lists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            tasks: [...list.tasks, response.data]
          };
        }
        return list;
      });

      setProject({ ...project, lists: updatedLists });
      setNewTaskTitle('');
      setActiveListForNewTask(null);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTask = (task) => {
    setActiveTask(task);
    setEditDesc(task.description || '');
    setSelectedAssignee(task.assigned_to ? task.assigned_to.toString() : '');
    setSelectedPriority(task.priority || 'LOW');
    setSelectedDueDate(task.due_date || '');
    setIsEditingDesc(false);
    setShowTaskModal(true);
  };

  const handleSaveDescription = async () => {
    try {
      const response = await API.patch(`tasks/${activeTask.id}/`, {
        description: editDesc
      });
      setActiveTask({ ...activeTask, description: response.data.description });
      setIsEditingDesc(false);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriorityChange = async (priority) => {
    try {
      const res = await API.patch(`tasks/${activeTask.id}/`, { priority });
      setActiveTask({ ...activeTask, priority: res.data.priority });
      setSelectedPriority(priority);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDueDateChange = async (dueDate) => {
    try {
      const res = await API.patch(`tasks/${activeTask.id}/`, { due_date: dueDate || null });
      setActiveTask({ ...activeTask, due_date: res.data.due_date });
      setSelectedDueDate(dueDate);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssigneeChange = async (userId) => {
    try {
      const res = await API.patch(`tasks/${activeTask.id}/`, {
        assigned_to: userId ? parseInt(userId) : null
      });
      setActiveTask({ ...activeTask, assigned_to: res.data.assigned_to, assigned_to_detail: res.data.assigned_to_detail });
      setSelectedAssignee(userId);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const response = await API.post('comments/', {
        task: activeTask.id,
        text: commentText
      });
      setActiveTask({
        ...activeTask,
        comments: [...(activeTask.comments || []), response.data]
      });
      setCommentText('');
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('task', activeTask.id);
    formData.append('file', file);

    try {
      const response = await API.post('attachments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setActiveTask({
        ...activeTask,
        attachments: [...(activeTask.attachments || []), response.data]
      });
      fetchProject();
    } catch (err) {
      console.error('File upload failed', err);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    try {
      const response = await API.post(`projects/${id}/add_member/`, {
        email_or_username: inviteInput
      });
      setInviteSuccess(response.data.message);
      setInviteInput('');
      fetchProject();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to add member.');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await API.delete(`tasks/${activeTask.id}/`);
      setShowTaskModal(false);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  // Progress calculator (Percentage of tasks in the last list/Completed list)
  const calculateProgress = () => {
    if (!project || !project.lists || project.lists.length === 0) return 0;
    let totalTasks = 0;
    let completedTasks = 0;

    project.lists.forEach((list, idx) => {
      totalTasks += list.tasks.length;
      // Classify the last list, or list named 'Completed'/'Done' as complete
      if (idx === project.lists.length - 1 || list.name.toLowerCase().includes('completed') || list.name.toLowerCase().includes('done')) {
        completedTasks += list.tasks.length;
      }
    });

    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'HIGH': return 'var(--danger)';
      case 'MEDIUM': return 'var(--warning)';
      case 'LOW': return 'var(--accent)';
      default: return 'var(--text-muted)';
    }
  };

  if (!project) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading project board...</div>;

  const progressPercent = calculateProgress();

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      {/* Board Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{project.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{project.description}</p>
        </div>
        
        {/* Actions Row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Invite form */}
          <form onSubmit={handleInviteMember} className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0.25rem 0.5rem', borderRadius: '10px', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '0.25rem 0.5rem', width: '160px', fontSize: '0.85rem' }}
              placeholder="Username or email..."
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}>
              <UserPlus size={14} /> Add
            </button>
          </form>
          
          <button className="btn btn-secondary" onClick={() => setShowActivityLog(!showActivityLog)}>
            <Activity size={16} /> {showActivityLog ? 'Hide History' : 'Activity History'}
          </button>
          
          <button className="btn btn-primary" onClick={() => setShowAddList(true)}>
            <Plus size={18} /> Add List
          </button>
        </div>
      </div>

      {/* Invite feedback alerts */}
      {inviteSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem' }}>{inviteSuccess}</p>}
      {inviteError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{inviteError}</p>}

      {/* Progress & Analytics Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
          <CheckSquare size={20} />
          <span style={{ fontWeight: 700 }}>Progress: {progressPercent}%</span>
        </div>
        <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', transition: 'width 0.4s ease' }}></div>
        </div>
      </div>

      {/* Main Container: Board or Activity log Split */}
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, alignItems: 'flex-start' }}>
        {/* Kanban Board Container */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board" style={{ flexGrow: 1 }}>
            {project.lists.map((list) => (
              <div key={list.id} className="kanban-column">
                <div className="column-header">
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{list.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                    {list.tasks.length}
                  </span>
                </div>

                <Droppable droppableId={list.id.toString()}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="task-list"
                    >
                      {list.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                              onClick={() => handleOpenTask(task)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: 800, 
                                  padding: '0.1rem 0.4rem', 
                                  borderRadius: '4px', 
                                  background: 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${getPriorityColor(task.priority)}`,
                                  color: getPriorityColor(task.priority) 
                                }}>
                                  {task.priority}
                                </span>
                                {task.due_date && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Calendar size={12} /> {task.due_date}
                                  </span>
                                )}
                              </div>
                              <h5 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{task.title}</h5>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {task.description || 'No description.'}
                              </p>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <MessageSquare size={12} />
                                    <span>{task.comments ? task.comments.length : 0}</span>
                                  </div>
                                  {task.attachments && task.attachments.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                      <Paperclip size={12} />
                                      <span>{task.attachments.length}</span>
                                    </div>
                                  )}
                                </div>
                                {task.assigned_to_detail && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)' }}>
                                    <User size={12} />
                                    <span>{task.assigned_to_detail.username}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {activeListForNewTask === list.id ? (
                  <form onSubmit={handleAddTask} style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      autoFocus
                      style={{ fontSize: '0.85rem', padding: '0.5rem', width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Add</button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setActiveListForNewTask(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setActiveListForNewTask(list.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', border: '1px dashed var(--border)', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                  >
                    <PlusCircle size={16} /> Add Task
                  </button>
                )}
              </div>
            ))}

            {showAddList && (
              <div className="kanban-column" style={{ background: 'var(--bg-surface)' }}>
                <form onSubmit={handleAddList}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>New List Name</h4>
                  <input
                    type="text"
                    className="form-input"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. In Review"
                    required
                    autoFocus
                    style={{ width: '100%', padding: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Save</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setShowAddList(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </DragDropContext>

        {/* Activity Log Panel */}
        {showActivityLog && (
          <div className="glass-card" style={{ width: '320px', flexShrink: 0, padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} /> History Log
              </h3>
              <button onClick={() => setShowActivityLog(false)} style={{ cursor: 'pointer', opacity: 0.8 }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexText: 'column', flexDirection: 'column', gap: '0.75rem' }}>
              {project.activities && project.activities.map((log) => (
                <div key={log.id} style={{ fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.user_detail?.username || 'User'}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{log.action}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {(!project.activities || project.activities.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No activities logged yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {showTaskModal && activeTask && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem' }} onClick={() => setShowTaskModal(false)}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{activeTask.title}</h2>
            
            {/* Split Panel Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Assignee */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={14} /> Assignee
                </label>
                <select
                  className="form-input"
                  style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  value={selectedAssignee}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {project.members_detail && project.members_detail.map((m) => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} /> Priority
                </label>
                <select
                  className="form-input"
                  style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  value={selectedPriority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={14} /> Due Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  value={selectedDueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              {isEditingDesc ? (
                <div>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '100px', width: '100%', resize: 'vertical' }}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleSaveDescription}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setIsEditingDesc(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', minHeight: '60px' }}
                >
                  {activeTask.description || <span style={{ color: 'var(--text-muted)' }}>No description. Click to add one.</span>}
                </div>
              )}
            </div>

            {/* File Uploads / Attachments */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Paperclip size={18} /> Attachments
              </h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                {activeTask.attachments && activeTask.attachments.map((attach) => (
                  <div key={attach.id} className="glass-card" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <a href={`http://localhost:8000${attach.file}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                      {attach.file.split('/').pop()}
                    </a>
                  </div>
                ))}
                {(!activeTask.attachments || activeTask.attachments.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No attachments uploaded.</p>
                )}
              </div>

              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', cursor: 'pointer' }}>
                <Plus size={16} /> Upload Attachment File
              </label>
            </div>

            {/* Comments */}
            <div className="comment-section">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Comments</h3>
              
              <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ flexGrow: 1, padding: '0.5rem 0.75rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Post</button>
              </form>

              <div className="comment-list">
                {activeTask.comments && activeTask.comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        {comment.author_detail ? comment.author_detail.username : 'User'}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem' }}>{comment.text}</p>
                  </div>
                ))}
                {(!activeTask.comments || activeTask.comments.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No comments yet.</p>
                )}
              </div>
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleDeleteTask}>
                <Trash2 size={16} /> Delete Task
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setShowTaskModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
