'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDatingConversations,
  useDatingMessages,
  useMyKey,
} from '@/hooks/useCommunity';
import { apiError, datingApi } from '@/services/community.service';
import type { DatingMessage } from '@/types/community';

export default function DatingChatPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myKey = useMyKey();
  const conversationId = params?.conversationId as string;
  const conversationsQuery = useDatingConversations(true);
  const messagesQuery = useDatingMessages(conversationId, true);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = conversationsQuery.data?.find(
    (item) => item.id === conversationId
  );
  const peer = conversation?.peerProfile;
  const messages = [
    ...(messagesQuery.data?.pages.flatMap((page) => page.items) ?? []),
  ].reverse();

  useEffect(() => {
    if (!conversationId) return;
    void datingApi
      .markRead(conversationId)
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: [...myKey, 'dating-conversations'],
        })
      )
      .catch(() => undefined);
  }, [conversationId, myKey, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !conversationId) return;
    setBusy(true);
    try {
      await datingApi.sendMessage(conversationId, {
        type: 'TEXT',
        text: draft.trim(),
      });
      setDraft('');
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-messages', conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
    } catch (err) {
      alert(apiError(err, 'Could not send the message.'));
    } finally {
      setBusy(false);
    }
  };

  const sharePhone = async () => {
    setBusy(true);
    try {
      await datingApi.sharePhone(conversationId);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-messages', conversationId],
      });
    } catch (err) {
      alert(apiError(err, 'Could not share your phone number.'));
    } finally {
      setBusy(false);
    }
  };

  const removeConversation = async () => {
    if (
      !window.confirm(
        'Delete this conversation? It will be removed from your messages.'
      )
    ) {
      return;
    }
    try {
      await datingApi.deleteConversation(conversationId);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
      router.push('/messages');
    } catch (err) {
      alert(apiError(err, 'Could not delete the conversation.'));
    }
  };

  const reportMessage = async (messageId: string) => {
    if (reportReason.trim().length < 3) return;
    try {
      await datingApi.reportMessage(
        conversationId,
        messageId,
        reportReason.trim()
      );
      setReporting(null);
      setReportReason('');
      alert('Message reported to the safety team.');
    } catch (err) {
      alert(apiError(err, 'Could not report the message.'));
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-4xl flex-col px-4 py-6">
      <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border-custom bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="-ml-2 p-2 text-text-gray hover:bg-background-primary/50 md:hidden"
            aria-label="Back to Messages"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="h-10 w-10 overflow-hidden rounded-full bg-primaryLight">
            {peer?.photoUrl ? (
              <img
                src={peer.photoUrl}
                alt={peer.nickname}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-bold text-primary">
                {(peer?.nickname ?? 'D').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-semibold text-text">
              {peer?.nickname ?? 'Dating member'}
            </h1>
            <p className="text-xs text-text-gray">Dating conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={sharePhone}
            disabled={busy}
            className="rounded-lg border border-border-custom px-3 py-1.5 text-xs font-semibold text-text hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Share number
          </button>
          <button
            type="button"
            onClick={removeConversation}
            className="rounded-lg border border-error/40 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/5"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border-x border-border-custom bg-background p-4">
        {messagesQuery.isLoading ? (
          <p className="py-12 text-center text-text-gray">Loading messages…</p>
        ) : !messages.length ? (
          <p className="py-12 text-center text-text-gray">
            Say hello to start the conversation.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.isMine ? 'items-end' : 'items-start'
                }`}
              >
                <MessageBubble message={message} />
                {!message.isMine ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReporting(reporting === message.id ? null : message.id);
                      setReportReason('');
                    }}
                    className="mt-1 text-[11px] text-text-light-gray hover:text-error"
                  >
                    Report
                  </button>
                ) : null}
                {reporting === message.id ? (
                  <div className="mt-2 w-full max-w-sm rounded-xl border border-error/40 bg-error/5 p-3">
                    <input
                      type="text"
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      placeholder="What is wrong with this message?"
                      className="w-full rounded-lg border border-border-custom bg-background px-3 py-1.5 text-xs"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={reportReason.trim().length < 3}
                        onClick={() => reportMessage(message.id)}
                        className="rounded-lg bg-error px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Submit report
                      </button>
                      <button
                        type="button"
                        onClick={() => setReporting(null)}
                        className="text-xs text-text-gray"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="flex gap-2 rounded-b-xl border border-t-0 border-border-custom bg-background p-4 shadow-sm"
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-xl border border-border-custom bg-background px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="rounded-xl bg-primary px-5 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: DatingMessage }) {
  return (
    <div
      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
        message.isMine
          ? 'rounded-tr-none bg-primary text-white'
          : 'rounded-tl-none border border-border-custom bg-surface text-text'
      }`}
    >
      <p className="whitespace-pre-wrap break-words">
        {message.type === 'PHONE_SHARE'
          ? `Phone number: ${message.text}`
          : message.text}
      </p>
      <p
        className={`mt-1 text-right text-[10px] ${
          message.isMine ? 'text-white/70' : 'text-text-gray'
        }`}
      >
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}
