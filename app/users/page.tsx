'use client';

import { useState } from 'react';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/store/api/userApi';
import {
  Button,
  Badge,
  Table,
  Modal,
  Input,
  Select,
  ConfirmDialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Column } from '@/components/ui/Table';
import type { User, UserRole, UserStatus, CreateUserInput, UpdateUserInput } from '@/types';
import { formatDate } from '@/lib/utils';
import { UserCheck, UserPlus, Pencil, Trash2, Shield, Eye, Settings } from 'lucide-react';

const roleOptions = [
  { value: 'viewer', label: 'Viewer (Read-only — View data, no add/edit/delete)' },
  { value: 'operator', label: 'Operator (Create & Edit data, no delete)' },
  { value: 'admin', label: 'Admin (Full access — Create, edit, delete & manage users)' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function UsersPage() {
  const { userId: currentUserId, isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data, isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users = data?.data ?? [];

  // Create form
  const [form, setForm] = useState<CreateUserInput>({
    phone: '',
    name: '',
    password: '',
    role: 'viewer',
  });

  // Edit form
  const [editForm, setEditForm] = useState<UpdateUserInput>({});

  function handleOpenEdit(u: User) {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      status: u.status,
      password: '',
    });
  }

  async function handleCreate() {
    if (!form.phone.trim() || !form.name.trim() || !form.password) {
      showError('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await createUser(form).unwrap();
      if (res.success) {
        success('User created successfully');
        setShowAddModal(false);
        setForm({ phone: '', name: '', password: '', role: 'viewer' });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'data' in err
        ? (err as { data: { error?: string } }).data?.error || 'Failed to create user'
        : 'Failed to create user';
      showError(msg);
    }
  }

  async function handleUpdate() {
    if (!editingUser) return;
    try {
      const payload: UpdateUserInput = {
        name: editForm.name?.trim(),
        role: editForm.role,
        status: editForm.status,
      };
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
      }
      const res = await updateUser({
        id: editingUser.id,
        ...payload,
      }).unwrap();
      if (res.success) {
        success('User updated successfully');
        setEditingUser(null);
      }
    } catch {
      showError('Failed to update user');
    }
  }

  async function handleDelete() {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id).unwrap();
      success('User deleted successfully');
      setUserToDelete(null);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'data' in err
        ? (err as { data: { error?: string } }).data?.error || 'Failed to delete user'
        : 'Failed to delete user';
      showError(msg);
    }
  }

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="info">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Admin
            </span>
          </Badge>
        );
      case 'operator':
        return (
          <Badge variant="success">
            <span className="flex items-center gap-1">
              <Settings className="h-3 w-3" /> Operator
            </span>
          </Badge>
        );
      case 'viewer':
      default:
        return (
          <Badge variant="neutral">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> Viewer (Read-only)
            </span>
          </Badge>
        );
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">
            {r.name}
            {r.id === currentUserId && (
              <span className="ml-1.5 text-xs text-indigo-600 font-normal">(You)</span>
            )}
          </p>
          <p className="text-xs text-slate-400">{r.phone}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Permissions',
      render: (r) => roleBadge(r.role),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>
          {r.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      hideOnMobile: true,
      render: (r) => formatDate(r.createdAt),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions' as keyof User,
            header: 'Actions',
            render: (r: User) => (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Edit user"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {r.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => setUserToDelete(r)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">গ্যারেজের ব্যবহারকারী ও অনুমতি পরিচালনা</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            + Add User
          </Button>
        )}
      </div>

      {/* Role explanation banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
        <p className="font-semibold mb-1">User Roles & Access Levels</p>
        <ul className="space-y-1 text-xs text-indigo-700">
          <li>
            • <strong>Viewer (Read-only)</strong>: Can log in and view all dashboard, financial, vehicle, and tenant data, but <strong>cannot create, edit, or delete</strong> any records.
          </li>
          <li>
            • <strong>Operator</strong>: Can create and edit daily entries, rent payments, income, expenses, tenants, and vehicles, but cannot delete records.
          </li>
          <li>
            • <strong>Admin (Owner)</strong>: Has complete control over all data including deletion and user management.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={users}
          loading={isLoading}
          emptyMessage="No users found"
          emptyIcon={<UserCheck className="h-6 w-6" />}
          keyExtractor={(r) => r.id}
        />
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User to Garage"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isCreating}>
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="userName"
            label="Full Name"
            required
            placeholder="e.g., Rahim Ahmed"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            id="userPhone"
            label="Mobile / Phone Number (Used for Login)"
            required
            placeholder="01XXXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <Input
            id="userPassword"
            label="Password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <Select
            id="userRole"
            label="Role & Access Level"
            required
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
          />
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Edit User — ${editingUser?.name ?? ''}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={isUpdating}>
              Update User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="edit_userName"
            label="Full Name"
            required
            value={editForm.name ?? ''}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Select
            id="edit_userRole"
            label="Role & Access Level"
            required
            options={roleOptions}
            value={editForm.role ?? 'viewer'}
            onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as UserRole }))}
          />
          <Select
            id="edit_userStatus"
            label="Status"
            required
            options={statusOptions}
            value={editForm.status ?? 'active'}
            onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as UserStatus }))}
          />
          <Input
            id="edit_userPassword"
            label="New Password (Leave blank to keep current)"
            type="password"
            placeholder="Optional — minimum 6 characters"
            value={editForm.password ?? ''}
            onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to remove ${userToDelete?.name} (${userToDelete?.phone}) from the garage? They will no longer be able to log in.`}
        confirmText="Delete User"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
