"use client";

import axios from "axios";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { toast } from "react-hot-toast";
import { IoClose } from "react-icons/io5";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isBanned: boolean;
  createdAt: Date;
  _count: {
    listings: number;
  };
};

interface AdminUsersClientProps {
  users: AdminUser[];
}

interface UserFormProps {
  title: string;
  isCreate: boolean;
  isLoading: boolean;
  selectedUser: AdminUser | null;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isBanned: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (value: UserRole) => void;
  setIsBanned: (value: boolean) => void;
}

const roles: UserRole[] = [
  "USER",
  "HOST",
  "VIP_HOST",
  "AGENCY",
  "MANAGER",
  "ADMIN",
];

const UserForm: React.FC<UserFormProps> = ({
  title,
  isCreate,
  isLoading,
  selectedUser,
  name,
  email,
  password,
  role,
  isBanned,
  onClose,
  onSubmit,
  onDelete,
  setName,
  setEmail,
  setPassword,
  setRole,
  setIsBanned,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {!isCreate && selectedUser && (
            <div>
              <label className="font-medium">User ID</label>
              <input
                disabled
                value={selectedUser.id}
                className="mt-2 w-full border rounded-lg p-3 bg-neutral-100"
              />
            </div>
          )}

          <div>
            <label className="font-medium">Name</label>
            <input
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="font-medium">Email</label>
            <input
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              name={isCreate ? "admin-create-email" : "admin-edit-email"}
              autoComplete="off"
              className="mt-2 w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="font-medium">
              {isCreate ? "Password" : "New Password"}
            </label>
            <input
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              name={isCreate ? "admin-create-password" : "admin-edit-password"}
              autoComplete="new-password"
              placeholder={
                isCreate
                  ? "Minimum 6 characters"
                  : "Leave empty to keep current password"
              }
              className="mt-2 w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="font-medium">Role</label>
            <select
              disabled={isLoading}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-2 w-full border rounded-lg p-3"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isBanned}
              onChange={(e) => setIsBanned(e.target.checked)}
            />

            <label className="font-medium">Banned</label>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          {!isCreate ? (
            <button
              disabled={isLoading}
              onClick={onDelete}
              className="px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
              <div />
            )}

          <button
            disabled={isLoading}
            onClick={onSubmit}
            className="px-5 py-3 rounded-xl bg-black text-white font-semibold hover:opacity-80 transition disabled:opacity-50"
          >
            {isCreate ? "Create user" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUsersClient: React.FC<AdminUsersClientProps> = ({ users }) => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [password, setPassword] = useState("");
  const [isBanned, setIsBanned] = useState(false);

  const perPage = 10;

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.id.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q);

      const matchesRole = !roleFilter || user.role === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && !user.isBanned) ||
        (statusFilter === "banned" && user.isBanned);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("USER");
    setPassword("");
    setIsBanned(false);
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setName(user.name || "");
    setEmail(user.email || "");
    setRole(user.role);
    setPassword("");
    setIsBanned(user.isBanned);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedUser(null);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const onCreate = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    axios
      .post("/api/admin/users", {
        name,
        email,
        password,
        role,
        isBanned,
      })
      .then(() => {
        toast.success("User created");
        router.refresh();
        closeCreateModal();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onSave = async () => {
    if (!selectedUser) return;

    setIsLoading(true);

    axios
      .patch(`/api/admin/users/${selectedUser.id}`, {
        name,
        email,
        role,
        password: password || undefined,
        isBanned,
      })
      .then(() => {
        toast.success("User updated");
        router.refresh();
        closeEditModal();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onDelete = async () => {
    if (!selectedUser) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedUser.email}?`
    );

    if (!confirmed) return;

    setIsLoading(true);

    axios
      .delete(`/api/admin/users/${selectedUser.id}`)
      .then(() => {
        toast.success("User deleted");
        router.refresh();
        closeEditModal();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            name="admin-user-search"
            autoComplete="off"
            placeholder="Search by name, email or id..."
            className="md:col-span-2 w-full border rounded-xl p-4"
          />

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-xl p-4"
          >
            <option value="">All roles</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-xl p-4"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-4 rounded-xl bg-black text-white font-semibold hover:opacity-80 transition whitespace-nowrap"
        >
          Create User
        </button>
      </div>

      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Listings</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-t hover:bg-neutral-50">
                <td className="p-4">
                  <button
                    onClick={() => openEditModal(user)}
                    className="font-mono text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    {user.id}
                  </button>
                </td>

                <td className="p-4">{user.name || "No name"}</td>

                <td className="p-4">{user.email || "No email"}</td>

                <td className="p-4">
                  <button
                    onClick={() =>
                      router.push(`/admin/users/${user.id}/listings`)
                    }
                    className="text-rose-500 font-semibold hover:underline"
                  >
                    {user._count.listings}
                  </button>
                </td>

                <td className="p-4 font-semibold">{user.role}</td>

                <td className="p-4">
                  {user.isBanned ? (
                    <span className="text-red-600 font-semibold">Banned</span>
                  ) : (
                      <span className="text-green-600 font-semibold">Active</span>
                    )}
                </td>

                <td className="p-4 text-neutral-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}

            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Previous
        </button>

        <div>
          Page {page} / {totalPages || 1}
        </div>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((value) => value + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {selectedUser && (
        <UserForm
          title="Edit User"
          isCreate={false}
          isLoading={isLoading}
          selectedUser={selectedUser}
          name={name}
          email={email}
          password={password}
          role={role}
          isBanned={isBanned}
          onClose={closeEditModal}
          onSubmit={onSave}
          onDelete={onDelete}
          setName={setName}
          setEmail={setEmail}
          setPassword={setPassword}
          setRole={setRole}
          setIsBanned={setIsBanned}
        />
      )}

      {isCreateOpen && (
        <UserForm
          title="Create User"
          isCreate
          isLoading={isLoading}
          selectedUser={null}
          name={name}
          email={email}
          password={password}
          role={role}
          isBanned={isBanned}
          onClose={closeCreateModal}
          onSubmit={onCreate}
          onDelete={onDelete}
          setName={setName}
          setEmail={setEmail}
          setPassword={setPassword}
          setRole={setRole}
          setIsBanned={setIsBanned}
        />
      )}
    </>
  );
};

export default AdminUsersClient;