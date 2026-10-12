"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { API_BASE } from "@/lib/config";
import { authHeader } from "@/lib/auth";
import { notifyError, notifySuccess } from "@/lib/notify";

type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  image_url: string | null;
  created_at: number | null;
  last_sign_in_at: number | null;
  application_count: number;
  banned: boolean;
};

type Status = "loading" | "ok" | "forbidden" | "error";

const formatDate = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString() : "—");

export default function AdminPage() {
  const { getToken } = useAuth();
  const { user: me } = useUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const loadUsers = async () => {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/api/admin/users`, { headers: authHeader(token) });
    if (res.status === 403) return setStatus("forbidden");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "" }));
      setErrorMessage(err.detail || `Error ${res.status}`);
      return setStatus("error");
    }
    setUsers(await res.json());
    setStatus("ok");
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const runAction = async (userId: string, action: "ban" | "unban" | "delete") => {
    const token = await getToken();
    const path = action === "delete" ? `/api/admin/users/${userId}` : `/api/admin/users/${userId}/${action}`;
    const res = await fetch(`${API_BASE}${path}`, {
      method: action === "delete" ? "DELETE" : "POST",
      headers: authHeader(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "" }));
      notifyError("Action failed", err.detail || `Error ${res.status}`);
      return;
    }
    const messages = { ban: "User banned", unban: "User unbanned", delete: "User deleted" };
    notifySuccess(messages[action]);
    await loadUsers();
  };

  if (status === "loading") return <p className="container mx-auto p-4">Loading users...</p>;
  if (status === "forbidden") return <p className="container mx-auto p-4">Admin access required.</p>;
  if (status === "error") return <p className="container mx-auto p-4">Could not load users: {errorMessage}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Users</h1>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Last sign-in</th>
              <th className="px-4 py-3 text-right">Applications</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isMe = user.id === me?.id;
              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image_url && (
                        <img src={user.image_url} alt="" className="size-8 rounded-full" />
                      )}
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3 text-right">{user.application_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        user.banned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isMe ? (
                      <span className="text-xs text-gray-500">You</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAction(user.id, user.banned ? "unban" : "ban")}
                        >
                          {user.banned ? "Unban" : "Ban"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the account and its {user.application_count} application(s). This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-3">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => runAction(user.id, "delete")}
                              >
                                Delete user
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
