'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { useThreads, useCreateThread } from '@/hooks/useThreads';
import { Pagination } from '@/components/Pagination';
import { ThreadStatus } from '@/types/threads';

interface Thread {
  id: string;
  title: string;
  status: ThreadStatus;
  createdAt: string;
  updatedAt: string;
}

function ThreadsContent() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
  });

  const { data: threadsResponse, isLoading, refetch } = useThreads({ page, limit: 10 });
  const createThreadMutation = useCreateThread();

  const threads = threadsResponse?.data || [];
  const totalPages = threadsResponse?.pagination?.totalPages || 1;

  const handleCreateThread = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a thread title');
      return;
    }

    createThreadMutation.mutate(
      {
        title: formData.title,
        type: 'SUPPORT',
        priority: 'NORMAL',
      },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setFormData({
            title: '',
          });
          refetch();
        },
      }
    );
  };

  const getStatusColor = (status: ThreadStatus): string => {
    const colorMap: Record<ThreadStatus, string> = {
      'OPEN': 'bg-success/20 text-success',
      'CLOSED': 'bg-error/20 text-error',
      'PENDING': 'bg-warning/20 text-warning',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-text-gray">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Help & Support</h1>
          <p className="text-sm text-text-gray">
            Create and manage support tickets or report issues
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-primary hover:opacity-90"
        >
          New Support Ticket
        </Button>
      </div>

      {/* Empty State */}
      {threads.length === 0 ? (
        <div className="text-center py-12 bg-background-primary/30 rounded-lg">
          <p className="text-text-gray mb-4">You haven't created any support tickets yet.</p>
          <Button
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Your First Ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread: Thread) => (
            <Link key={thread.id} href={`/account/threads/${thread.id}`}>
              <div className="bg-background rounded-lg border border-border-custom p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text mb-2 truncate">
                      {thread.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(thread.status)}`}>
                        {thread.status}
                      </span>
                      <span className="text-xs text-text-gray">
                        {format(new Date(thread.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-text-gray"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Create Thread Dialog */}
      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Create Support Ticket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Describe your issue..."
              className="w-full px-4 py-2 border border-border-custom rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={200}
            />
            <p className="text-xs text-text-gray mt-1">
              {formData.title.length}/200
            </p>
          </div>



          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateThread}
              disabled={createThreadMutation.isPending}
              className="bg-primary hover:opacity-90"
            >
              {createThreadMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function ThreadsPage() {
  return <ThreadsContent />;
}
