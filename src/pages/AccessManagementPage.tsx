import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Pencil, Trash2, UserRoundX } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useToast } from "@/components/shared/ToastProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  createPortalUser,
  deletePortalUser,
  getPortalUsers,
  resetPortalUserPassword,
  setPortalUserStatus,
  updatePortalUser,
} from "@/services/api";
import { formatDateTime } from "@/lib/format";
import type { PortalUserAccount } from "@/types";

const createSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "viewer"]),
});

const editSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  role: z.enum(["admin", "viewer"]),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function AccessManagementPage() {
  const usersQuery = useQuery({ queryKey: ["portal-users"], queryFn: getPortalUsers });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, reconcilePortalUser } = useAuth();
  const { showToast } = useToast();
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [resetTarget, setResetTarget] = useState<PortalUserAccount | null>(null);
  const [statusTarget, setStatusTarget] = useState<PortalUserAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalUserAccount | null>(null);

  const selectedUser = useMemo(
    () => usersQuery.data?.find((entry) => entry.id === selectedUserId) ?? null,
    [selectedUserId, usersQuery.data],
  );

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      role: "viewer",
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      role: "viewer",
    },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!usersQuery.data?.length) return;
    if (!selectedUserId) {
      setSelectedUserId(usersQuery.data[0].id);
      return;
    }
    if (!usersQuery.data.some((entry) => entry.id === selectedUserId)) {
      setSelectedUserId(usersQuery.data[0].id);
    }
  }, [selectedUserId, usersQuery.data]);

  useEffect(() => {
    if (!selectedUser) return;
    editForm.reset({
      fullName: selectedUser.fullName,
      username: selectedUser.username,
      email: selectedUser.email,
      role: selectedUser.role,
    });
    setEditError("");
  }, [editForm, selectedUser]);

  const createMutation = useMutation({
    mutationFn: createPortalUser,
    onSuccess: (createdUser) => {
      queryClient.invalidateQueries({ queryKey: ["portal-users"] });
      createForm.reset();
      setCreateError("");
      setSelectedUserId(createdUser.id);
      showToast("Portal login created");
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : "Unable to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditFormValues }) => updatePortalUser(id, values),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["portal-users"] });
      reconcilePortalUser(updatedUser);
      setEditError("");
      showToast("User account updated");
    },
    onError: (err) => {
      setEditError(err instanceof Error ? err.message : "Unable to update user");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetPortalUserPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-users"] });
      resetForm.reset();
      setPasswordError("");
      setResetTarget(null);
      showToast("Password reset");
    },
    onError: (err) => {
      setPasswordError(err instanceof Error ? err.message : "Unable to reset password");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "disabled" }) => setPortalUserStatus(id, status),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["portal-users"] });
      reconcilePortalUser(updatedUser);
      setStatusTarget(null);
      showToast(updatedUser.status === "active" ? "User reactivated" : "User deactivated");
      if (user?.id === updatedUser.id && updatedUser.status !== "active") {
        navigate("/sign-in");
      }
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Unable to update status", "error");
      setStatusTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePortalUser,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["portal-users"] });
      if (user?.id === deletedId) {
        reconcilePortalUser(null);
        navigate("/sign-in");
      }
      if (selectedUserId === deletedId) {
        setSelectedUserId("");
      }
      setDeleteTarget(null);
      showToast("User deleted");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Unable to delete user", "error");
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access Control"
        title="Portal logins"
        description="Admins can create sign-in accounts, rename users, reset passwords, and deactivate or remove access."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (portalUser) => (
                <div>
                  <p className="font-semibold text-slate-900">{portalUser.fullName}</p>
                  <p className="text-xs text-slate-500">{portalUser.email}</p>
                </div>
              ),
            },
            { key: "username", header: "Username", render: (portalUser) => portalUser.username },
            { key: "role", header: "Role", render: (portalUser) => <StatusBadge value={portalUser.role} /> },
            { key: "status", header: "Status", render: (portalUser) => <StatusBadge value={portalUser.status} /> },
            {
              key: "lastLogin",
              header: "Last Login",
              render: (portalUser) => (portalUser.lastLoginAt === "Never" ? "Never" : formatDateTime(portalUser.lastLoginAt)),
            },
            {
              key: "actions",
              header: "Actions",
              render: (portalUser) => (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedUserId(portalUser.id)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setPasswordError("");
                      resetForm.reset();
                      setResetTarget(portalUser);
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset password
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusTarget(portalUser)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <UserRoundX className="h-3.5 w-3.5" />
                      {portalUser.status === "active" ? "Deactivate" : "Activate"}
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(portalUser)}
                    className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </span>
                  </button>
                </div>
              ),
            },
          ]}
          rows={usersQuery.data ?? []}
          footer={
            <div className="text-sm text-slate-500">
              Select a user to edit profile details. Password resets, deactivation, and deletion are available from each row.
            </div>
          }
        />

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">Create portal login</h2>
            <form
              className="mt-5 space-y-4"
              onSubmit={createForm.handleSubmit((value) => {
                setCreateError("");
                createMutation.mutate(value);
              })}
            >
              <Field label="Full name" error={createForm.formState.errors.fullName?.message}>
                <input {...createForm.register("fullName")} className="field" />
              </Field>
              <Field label="Username" error={createForm.formState.errors.username?.message}>
                <input {...createForm.register("username")} className="field" />
              </Field>
              <Field label="Email" error={createForm.formState.errors.email?.message}>
                <input {...createForm.register("email")} className="field" />
              </Field>
              <Field label="Password" error={createForm.formState.errors.password?.message}>
                <input type="password" {...createForm.register("password")} className="field" />
              </Field>
              <Field label="Role" error={createForm.formState.errors.role?.message}>
                <select {...createForm.register("role")} className="field">
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              {createError ? <InlineError message={createError} /> : null}

              <button disabled={createMutation.isPending} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {createMutation.isPending ? "Creating..." : "Create login"}
              </button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Edit selected login</h2>
              {selectedUser ? <StatusBadge value={selectedUser.status} /> : null}
            </div>
            {selectedUser ? (
              <form
                className="mt-5 space-y-4"
                onSubmit={editForm.handleSubmit((values) => {
                  setEditError("");
                  updateMutation.mutate({ id: selectedUser.id, values });
                })}
              >
                <Field label="Full name" error={editForm.formState.errors.fullName?.message}>
                  <input {...editForm.register("fullName")} className="field" />
                </Field>
                <Field label="Username" error={editForm.formState.errors.username?.message}>
                  <input {...editForm.register("username")} className="field" />
                </Field>
                <Field label="Email" error={editForm.formState.errors.email?.message}>
                  <input {...editForm.register("email")} className="field" />
                </Field>
                <Field label="Role" error={editForm.formState.errors.role?.message}>
                  <select {...editForm.register("role")} className="field">
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Created {formatDateTime(selectedUser.createdAt)}. {selectedUser.lastLoginAt === "Never" ? "This user has not signed in yet." : `Last sign-in ${formatDateTime(selectedUser.lastLoginAt)}.`}
                </div>

                {editError ? <InlineError message={editError} /> : null}

                <button disabled={updateMutation.isPending} className="w-full rounded-2xl bg-[var(--portal-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Select a user from the table to rename the account or change its role and email.
              </div>
            )}
          </Card>
        </div>
      </div>

      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-950">Reset password</h3>
            <p className="mt-2 text-sm text-slate-500">
              Set a new password for <span className="font-medium text-slate-700">{resetTarget.username}</span>.
            </p>
            <form
              className="mt-5 space-y-4"
              onSubmit={resetForm.handleSubmit((values) => {
                setPasswordError("");
                resetPasswordMutation.mutate({ id: resetTarget.id, password: values.password });
              })}
            >
              <Field label="New password" error={resetForm.formState.errors.password?.message}>
                <input type="password" {...resetForm.register("password")} className="field" />
              </Field>
              <Field label="Confirm password" error={resetForm.formState.errors.confirmPassword?.message}>
                <input type="password" {...resetForm.register("confirmPassword")} className="field" />
              </Field>
              {passwordError ? <InlineError message={passwordError} /> : null}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setResetTarget(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={resetPasswordMutation.isPending} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.status === "active" ? "Deactivate user?" : "Activate user?"}
        description={
          statusTarget?.status === "active"
            ? "The user will no longer be able to sign in until the account is reactivated."
            : "This will restore access for the selected portal login."
        }
        confirmLabel={statusTarget?.status === "active" ? "Deactivate" : "Activate"}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return;
          statusMutation.mutate({
            id: statusTarget.id,
            status: statusTarget.status === "active" ? "disabled" : "active",
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user?"
        description="This permanently removes the portal login. Use deactivation instead if you may need to restore access later."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>;
}
