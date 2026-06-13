'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { TaskWithRelations } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import Avatar from './Avatar';
import { MessageSquare, Send, AtSign } from 'lucide-react';

interface CommentSectionProps {
  task: TaskWithRelations;
  onUpdate: () => void;
}

export default function CommentSection({ task, onUpdate }: CommentSectionProps) {
  const currentUser = useStore((state) => state.currentUser);
  const addComment = useStore((state) => state.addComment);
  const users = useStore((state) => state.users);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const mentionRegex = /@(\S+)/g;
      const mentions: string[] = [];
      let matchResult = mentionRegex.exec(newComment);
      while (matchResult) {
        const name = matchResult[1];
        const mentionedUser = users.find(u => u.name === name);
        if (mentionedUser) {
          mentions.push(mentionedUser.id);
        }
        matchResult = mentionRegex.exec(newComment);
      }

      await addComment({
        task_id: task.id,
        content: newComment.trim(),
        mentions,
      });
      setNewComment('');
      onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertMention = (userName: string) => {
    setNewComment(prev => prev + `@${userName} `);
    setShowMentionList(false);
  };

  const mentionableUsers = users.filter(u => 
    u.department_id === task.department_id || u.role === 'admin'
  );

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-900" />
        评论交流
        <span className="text-sm font-normal text-gray-500">
          ({task.comments?.length || 0})
        </span>
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              if (e.target.value.endsWith('@')) {
                setShowMentionList(true);
              } else {
                setShowMentionList(false);
              }
            }}
            placeholder="发表评论... 使用 @ 提及相关人员"
            className="input min-h-[80px] pr-12 resize-none"
            rows={3}
          />
          <button
            type="button"
            onClick={() => setShowMentionList(!showMentionList)}
            className="absolute right-3 top-3 p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
          >
            <AtSign className="w-5 h-5" />
          </button>

          {showMentionList && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {mentionableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => insertMention(user.name)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Avatar name={user.name} size="sm" />
                  <span>{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-400">
            按 Enter 发送，Shift + Enter 换行
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="btn-primary"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? '发送中...' : '发送'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {(!task.comments || task.comments.length === 0) ? (
          <div className="text-center py-6 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">暂无评论，来发表第一条评论吧</p>
          </div>
        ) : (
          task.comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-fade-in">
              <Avatar name={comment.user?.name || '未知用户'} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {comment.user?.name || '未知用户'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
