import React, { useState, useEffect, useMemo } from 'react';
import { UserAdminData, fetchAdminUsers, createAdminUser, updateAdminUser } from '../api';

export function AdminUserManagement() {
  const [users, setUsers] = useState<UserAdminData[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdminData | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'REQUESTER',
    password: '',
    isActive: true,
  });

  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]); // Reload from server on role filter change (or search submit)

  const loadUsers = async (querySearch: string = search) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers(querySearch, roleFilter);
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.name < b.name) return sortOrder === 'asc' ? -1 : 1;
      if (a.name > b.name) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortOrder]);

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderRoleBadge = (role: string) => {
    let className = 'zen-badge ';
    if (role === 'REQUESTER') className += 'zen-badge-low';
    else if (role === 'IT_STAFF') className += 'zen-badge-new';
    else if (role === 'ADMINISTRATOR') className += 'zen-badge-urgent';
    return <span className={className} style={{ minWidth: '100px', textAlign: 'center' }}>{role.replace('_', ' ')}</span>;
  };

  const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="zen-badge zen-badge-new">Active</span>;
    }
    return <span className="zen-badge zen-badge-closed">Inactive</span>;
  };

  const openCreateModal = () => {
    setFormData({ name: '', email: '', role: 'REQUESTER', password: '', isActive: true });
    setModalError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (user: UserAdminData) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, password: '', isActive: user.isActive });
    setModalError(null);
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalBusy(true);
    setModalError(null);
    try {
      await createAdminUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      });
      setShowCreateModal(false);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalBusy(true);
    setModalError(null);
    try {
      await updateAdminUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        newPassword: formData.password ? formData.password : undefined,
      });
      setShowEditModal(false);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalBusy(false);
    }
  };

  return (
    <div className="zen-container" style={{ paddingBottom: '3rem' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)', fontWeight: 600 }}>Administrator User Management</h2>

      <div className="zen-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            className="zen-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="zen-btn-secondary">Search</button>
        </form>

        <select 
          className="zen-select" 
          style={{ width: 'auto', minWidth: '150px' }}
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="REQUESTER">Requester</option>
          <option value="IT_STAFF">IT Staff</option>
          <option value="ADMINISTRATOR">Administrator</option>
        </select>

        <button className="btn-zen-primary" onClick={openCreateModal}>+ Create User</button>
      </div>

      <div className="zen-card" style={{ padding: '0' }}>
        {error && <div className="zen-alert-error" style={{ margin: '1rem' }}>{error}</div>}
        
        <div className="zen-table-responsive">
          <table className="zen-table">
            <thead>
              <tr>
                <th onClick={toggleSort} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Name {sortOrder === 'asc' ? '↑' : '↓'}
                </th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
              ) : sortedUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td></tr>
              ) : (
                sortedUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{u.name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td>{renderRoleBadge(u.role)}</td>
                    <td>{renderStatusBadge(u.isActive)}</td>
                    <td>
                      <button 
                        className="zen-btn-secondary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => openEditModal(u)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="zen-modal-overlay">
          <div className="zen-modal-content">
            <div className="zen-modal-header" style={{ color: 'var(--color-primary)' }}>
              Create New User
            </div>
            <div className="zen-modal-body">
              {modalError && <div className="zen-alert-error" style={{ marginBottom: '1rem' }}>{modalError}</div>}
              <form id="createForm" onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Name</label>
                  <input required type="text" className="zen-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
                  <input required type="email" className="zen-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Role</label>
                  <select className="zen-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="REQUESTER">Requester</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Initial Password (min 8 chars)</label>
                  <input required type="text" minLength={8} className="zen-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="zen-modal-footer">
              <button type="button" className="zen-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" form="createForm" className="btn-zen-primary" disabled={modalBusy}>{modalBusy ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingUser && (
        <div className="zen-modal-overlay">
          <div className="zen-modal-content">
            <div className="zen-modal-header" style={{ color: 'var(--color-primary)' }}>
              Edit User
            </div>
            <div className="zen-modal-body">
              {modalError && <div className="zen-alert-error" style={{ marginBottom: '1rem' }}>{modalError}</div>}
              <form id="editForm" onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Name</label>
                  <input required type="text" className="zen-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
                  <input required type="email" className="zen-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Role</label>
                  <select className="zen-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="REQUESTER">Requester</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Status</label>
                  <select className="zen-select" value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-field-border)' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Reset Password (optional)</label>
                  <input type="text" minLength={8} className="zen-input" placeholder="Leave blank to keep current" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="zen-modal-footer">
              <button type="button" className="zen-btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" form="editForm" className="btn-zen-primary" disabled={modalBusy}>{modalBusy ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
