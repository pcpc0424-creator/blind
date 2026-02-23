'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2, Flag, ThumbsUp, ThumbsDown, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelativeTime, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  onReportComment?: (commentId: string) => void;
}

export function CommentSection({ postId, postAuthorId, onReportComment }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get<any[]>(`/posts/${postId}/comments`, {
        sort: 'oldest',
        limit: 100,
      });
      return response.data;
    },
  });

  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => {
      return api.post(`/posts/${postId}/comments`, {
        content,
        parentId,
        isAnonymous: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setNewComment('');
      setReplyingTo(null);
      setReplyContent('');
      toast({
        title: variables.parentId ? 'Reply Posted' : 'Comment Posted',
        description: variables.parentId ? 'Your reply has been posted.' : 'Your comment has been posted.',
      });
    },
  });

  // Vote comment mutation
  const voteComment = useMutation({
    mutationFn: async ({ commentId, value }: { commentId: string; value: 1 | -1 | 0 }) => {
      return api.post(`/comments/${commentId}/vote`, { value });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      const messages: Record<number, { title: string; description: string }> = {
        1: { title: 'Upvoted', description: 'You upvoted this comment.' },
        [-1]: { title: 'Downvoted', description: 'You downvoted this comment.' },
        0: { title: 'Vote Removed', description: 'Your vote has been removed.' },
      };
      toast(messages[variables.value]);
    },
  });

  // Update comment mutation
  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return api.patch(`/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast({
        title: 'Comment Updated',
        description: 'Your comment has been updated.',
      });
    },
  });

  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      return api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast({
        title: 'Comment Deleted',
        description: 'Your comment has been deleted.',
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || !isAuthenticated) return;
    createComment.mutate({ content: newComment.trim() });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) return;
    createComment.mutate({ content: replyContent.trim(), parentId });
  };

  const comments = commentsData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {comments.length} Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Write comment */}
        {isAuthenticated ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createComment.isPending}
              >
                {createComment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Please sign in to write a comment
            </p>
          </div>
        )}

        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Be the first to comment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postAuthorId={postAuthorId}
                isAuthenticated={isAuthenticated}
                currentUserId={user?.id}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                isPending={createComment.isPending}
                onReport={onReportComment}
                onVote={(commentId, value) => voteComment.mutate({ commentId, value })}
                onUpdate={(commentId, content) => updateComment.mutate({ commentId, content })}
                onDelete={(commentId) => deleteComment.mutate(commentId)}
                isVoting={voteComment.isPending}
                isUpdating={updateComment.isPending}
                isDeleting={deleteComment.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: any;
  postAuthorId: string;
  isAuthenticated: boolean;
  currentUserId?: string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  isPending: boolean;
  isReply?: boolean;
  onReport?: (commentId: string) => void;
  onVote?: (commentId: string, value: 1 | -1 | 0) => void;
  onUpdate?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  isVoting?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

function CommentItem({
  comment,
  postAuthorId,
  isAuthenticated,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isPending,
  isReply = false,
  onReport,
  onVote,
  onUpdate,
  onDelete,
  isVoting,
  isUpdating,
  isDeleting,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isPostAuthor = comment.isAuthor;
  const isCommentAuthor = comment.isCommentAuthor;

  const handleVote = (value: 1 | -1) => {
    if (!onVote || !isAuthenticated) return;
    const newValue = comment.myVote === value ? 0 : value;
    onVote(comment.id, newValue);
  };

  const handleUpdate = () => {
    if (!onUpdate || !editContent.trim()) return;
    onUpdate(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  };

  return (
    <div className={cn('space-y-2', isReply && 'ml-8 pl-4 border-l-2')}>
      {/* Comment header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.author.isAnonymous
              ? comment.author.company?.name?.charAt(0) || 'A'
              : comment.author.nickname.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author.isAnonymous
                ? comment.author.company
                  ? `${comment.author.company.name} - ${comment.author.nickname}`
                  : comment.author.nickname
                : comment.author.nickname}
            </span>
            {isPostAuthor && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                OP
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {/* Comment content or edit form */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={!editContent.trim() || isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Comment actions */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2">
              {/* Vote buttons */}
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 px-1.5', comment.myVote === 1 && 'text-primary')}
                  onClick={() => handleVote(1)}
                  disabled={isVoting || !isAuthenticated}
                >
                  <ThumbsUp className={cn('h-3.5 w-3.5', comment.myVote === 1 && 'fill-current')} />
                </Button>
                <span className={cn(
                  'text-xs font-medium min-w-[1.5ch] text-center',
                  (comment.voteCount || 0) > 0 && 'text-primary',
                  (comment.voteCount || 0) < 0 && 'text-destructive'
                )}>
                  {comment.voteCount || 0}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 px-1.5', comment.myVote === -1 && 'text-destructive')}
                  onClick={() => handleVote(-1)}
                  disabled={isVoting || !isAuthenticated}
                >
                  <ThumbsDown className={cn('h-3.5 w-3.5', comment.myVote === -1 && 'fill-current')} />
                </Button>
              </div>

              <div className="w-px h-4 bg-border mx-1" />

              {!isReply && isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                >
                  Reply
                </Button>
              )}

              {/* Edit/Delete for comment author */}
              {isAuthenticated && isCommentAuthor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </>
              )}

              {isAuthenticated && onReport && !isCommentAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => onReport(comment.id)}
                >
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  Report
                </Button>
              )}
            </div>
          )}

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postAuthorId={postAuthorId}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              isPending={isPending}
              isReply
              onReport={onReport}
              onVote={onVote}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isVoting={isVoting}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
