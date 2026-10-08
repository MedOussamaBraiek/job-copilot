"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApplicationResponse } from "@/lib/types";
import { notifyError, notifySuccess } from "@/lib/notify";

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

const History = () => {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/applications");
      const data = await response.json();
      setApplications(data);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/applications/${id}`, {
        method: "DELETE",
      });
      setApplications(applications.filter((app) => app.id !== id));
      notifySuccess("Application deleted");
    } catch (error) {
      notifyError("Could not delete", "Please try again.");
    }
    setDeleteId(null);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <Link href="/">
          <Button>New Application</Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-600">No applications yet</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Applied</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {app.company_name || "Unknown company"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {app.match_score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded capitalize ${
                        app.status === "emailed"
                          ? "bg-blue-100 text-blue-800"
                          : app.status === "applied"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/history/${app.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>

                    <AlertDialog
                      open={deleteId === app.id}
                      onOpenChange={(open) => !open && setDeleteId(null)}
                    >
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(app.id)}
                          />
                        }
                      >
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Application
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleConfirmDelete(app.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;
