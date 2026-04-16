import { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Shield, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../utils/cn';
import * as api from '../services/api';
import type { 
  User as UserType, 
  Role as RoleType, 
  CreateUserData, 
  UpdateUserData, 
  CreateRoleData 
} from '../types';

// Color palette for role badges
const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  PROVISIONING_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
  SUPPORT_ADMIN: 'bg-green-100 text-green-700 border-green-200',
  READ_ONLY: 'bg-gray-100 text-gray-700 border-gray-200',
  FINANCE_VIEWER: 'bg-amber-100 text-amber-700 border-amber-200',
};

const allPermissions = [
  'view_dashboard',
  'view_tenants',
  'create_tenants',
  'edit_tenants',
  'suspend_tenants',
  'view_dids',
  'manage_dids',
  'view_users',
  'manage_users',
  'view_audit_log',
  'view_finance',
  'manage_settings',
];

const permissionLabels: Record<string, string> = {
  view_dashboard: 'View Dashboard',
  view_tenants: 'View Tenants',
  create_tenants: 'Create Tenants',
  edit_tenants: 'Edit Tenants',
  suspend_tenants: 'Suspend Tenants',
  view_dids: 'View DIDs',
  manage_dids: 'Manage DIDs',
  view_users: 'View Users',
  manage_users: 'Manage Users',
  view_audit_log: 'View Audit Log',
  view_finance: 'View Finance',
  manage_settings: 'Manage Settings',
};

export function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'user' | 'role'; id: string; name: string } | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);

  // Form states
  const [userForm, setUserForm] = useState<CreateUserData>({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role_code: 'READ_ONLY',
  });
  const [roleForm, setRoleForm] = useState<CreateRoleData>({
    code: '',
    name: '',
    description: '',
    permissions: [],
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role_code === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' ? user.is_active : !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // User handlers
  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', full_name: '', email: '', password: '', role_code: 'READ_ONLY' });
    setFormError('');
    setShowUserModal(true);
  };

  const openEditUser = (user: UserType) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      password: '',
      role_code: user.role_code,
    });
    setFormError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    setFormError('');
    if (!userForm.username || !userForm.full_name || !userForm.email) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (!editingUser && !userForm.password) {
      setFormError('Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          full_name: userForm.full_name,
          email: userForm.email,
          role_code: userForm.role_code,
          is_active: editingUser.is_active,
        };
        if (userForm.password) {
          updateData.password = userForm.password;
        }
        await api.updateUser(editingUser.id, updateData);
      } else {
        await api.createUser(userForm);
      }
      setShowUserModal(false);
      loadData();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to save user');
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteModal) return;
    try {
      await api.deleteUser(Number(showDeleteModal.id));
      setShowDeleteModal(null);
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  // Role handlers
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ code: '', name: '', description: '', permissions: [] });
    setFormError('');
    setShowRoleModal(true);
  };

  const openEditRole = (role: RoleType) => {
    setEditingRole(role);
    setRoleForm({
      code: role.code,
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setFormError('');
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    setFormError('');
    if (!roleForm.name || !roleForm.code) {
      setFormError('Role name and code are required');
      return;
    }

    try {
      if (editingRole) {
        await api.updateRole(editingRole.code, {
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
        });
      } else {
        await api.createRole(roleForm);
      }
      setShowRoleModal(false);
      loadData();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to save role');
    }
  };

  const handleDeleteRole = async () => {
    if (!showDeleteModal) return;
    try {
      await api.deleteRole(showDeleteModal.id);
      setShowDeleteModal(null);
      loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const togglePermission = (permission: string) => {
    setRoleForm((prev: CreateRoleData) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p: string) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const getUserCountForRole = (roleCode: string) => {
    return users.filter(u => u.role_code === roleCode).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users & Roles</h1>
          <p className="text-sm text-slate-500 mt-1">Manage portal users and access roles</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'users' ? (
            <button
              onClick={openCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          ) : (
            <button
              onClick={openCreateRole}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            <UsersIcon className="w-4 h-4" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              'flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            <Shield className="w-4 h-4" />
            Roles ({roles.length})
          </button>
        </nav>
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Roles</option>
              {roles.map(role => (
                <option key={role.code} value={role.code}>{role.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No users found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const role = roles.find(r => r.code === user.role_code);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{user.full_name}</div>
                                <div className="text-sm text-slate-500">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                              roleColors[user.role_code] || 'bg-gray-100 text-gray-700 border-gray-200'
                            )}>
                              {role?.name || user.role_code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                                user.is_active
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              )}
                            >
                              <span className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                user.is_active ? 'bg-green-500' : 'bg-red-500'
                              )} />
                              {user.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditUser(user)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteModal({ type: 'user', id: String(user.id), name: user.full_name })}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => {
            const userCount = getUserCountForRole(role.code);
            return (
              <div key={role.code} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        roleColors[role.code]?.includes('purple') ? 'bg-purple-100' :
                        roleColors[role.code]?.includes('blue') ? 'bg-blue-100' :
                        roleColors[role.code]?.includes('green') ? 'bg-green-100' :
                        roleColors[role.code]?.includes('amber') ? 'bg-amber-100' :
                        'bg-gray-100'
                      )}>
                        <Shield className={cn(
                          'w-5 h-5',
                          roleColors[role.code]?.includes('purple') ? 'text-purple-600' :
                          roleColors[role.code]?.includes('blue') ? 'text-blue-600' :
                          roleColors[role.code]?.includes('green') ? 'text-green-600' :
                          roleColors[role.code]?.includes('amber') ? 'text-amber-600' :
                          'text-gray-600'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{role.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{role.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditRole(role)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal({ type: 'role', id: role.code, name: role.name })}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {role.description && (
                    <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                      <UsersIcon className="w-3 h-3" />
                      {userCount} {userCount === 1 ? 'user' : 'users'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                      {role.permissions.length} permissions
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.slice(0, 5).map((perm: string) => (
                        <span key={perm} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {permissionLabels[perm] || perm}
                        </span>
                      ))}
                      {role.permissions.length > 5 && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          +{role.permissions.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button onClick={() => setShowUserModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Username *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={e => setUserForm((prev: CreateUserData) => ({ ...prev, username: e.target.value }))}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder="john.smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={e => setUserForm((prev: CreateUserData) => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Smith"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm((prev: CreateUserData) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm((prev: CreateUserData) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
                <select
                  value={userForm.role_code}
                  onChange={e => setUserForm((prev: CreateUserData) => ({ ...prev, role_code: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {roles.map(role => (
                    <option key={role.code} value={role.code}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Code *</label>
                  <input
                    type="text"
                    value={roleForm.code}
                    onChange={e => setRoleForm((prev: CreateRoleData) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                    disabled={!!editingRole}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder="CUSTOM_ROLE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name *</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={e => setRoleForm((prev: CreateRoleData) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Custom Role"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={e => setRoleForm((prev: CreateRoleData) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe this role's purpose..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">Permissions</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRoleForm((prev: CreateRoleData) => ({ ...prev, permissions: [...allPermissions] }))}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setRoleForm((prev: CreateRoleData) => ({ ...prev, permissions: [] }))}
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {allPermissions.map(permission => (
                    <label
                      key={permission}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        roleForm.permissions.includes(permission)
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{permissionLabels[permission]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete {showDeleteModal.type === 'user' ? 'User' : 'Role'}
                </h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <strong>{showDeleteModal.name}</strong>?
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This action cannot be undone.
              {showDeleteModal.type === 'role' && ' Users with this role will need to be reassigned.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showDeleteModal.type === 'user' ? handleDeleteUser : handleDeleteRole}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
