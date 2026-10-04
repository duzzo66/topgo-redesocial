"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
  BarChart3,
  BadgeCheck,
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { supabase } from "../lib/supabase";

type PostCardProps = {
  post: any;
  fallbackProfile: any;
  onLike?: (id: string) => void;
  onOpen?: () => void;
  detail?: boolean;
};
type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
  author?: any;
};
const compact = (n: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
const relativeTime = (date: string) => {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 1000),
  );
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d`;
  const year =
    new Date(date).getFullYear() !== new Date().getFullYear()
      ? "numeric"
      : undefined;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year,
  }).format(new Date(date));
};

export default function PostCard({
  post,
  fallbackProfile,
  onLike,
  onOpen,
  detail = false,
}: PostCardProps) {
  const author = post.profiles || fallbackProfile;
  const media = post.post_media || [];
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentError, setCommentError] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: 50, y: 50 });
  const [likeCount, setLikeCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    let active = true;
    const key = `post-actions:${post.id}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      setLiked(Boolean(saved.liked));
      setReposted(Boolean(saved.reposted));
      setComments(Array.isArray(saved.comments) ? saved.comments : []);
      if (saved.likeCount !== undefined) setLikeCount(saved.likeCount);
      if (saved.repostCount !== undefined) setRepostCount(saved.repostCount);
    } catch {
      // Local storage can be unavailable in private browsing.
    }
    supabase.from("comments").select("*,profiles!comments_author_id_fkey(*)").eq("post_id", post.id).order("created_at", { ascending: true }).then(({ data }) => {
      if (active && data) setComments(data.map((item: any) => ({ id: item.id, text: item.content, createdAt: item.created_at, author: item.profiles })));
    });
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user || !active) return;
      const [likes, reposts, bookmarks, bookmarkTotal] = await Promise.all([
        supabase.from("post_likes").select("user_id", { count: "exact" }).eq("post_id", post.id),
        supabase.from("post_reposts").select("user_id", { count: "exact" }).eq("post_id", post.id),
        supabase.from("post_bookmarks").select("user_id").eq("post_id", post.id).eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("post_bookmarks").select("user_id", { count: "exact" }).eq("post_id", post.id),
      ]);
      if (!active) return;
      setLikeCount(likes.count || 0);
      setRepostCount(reposts.count || 0);
      setBookmarkCount(bookmarkTotal.count || 0);
      setLiked(Boolean(likes.data?.some((item: any) => item.user_id === auth.user.id)));
      setReposted(Boolean(reposts.data?.some((item: any) => item.user_id === auth.user.id)));
      setBookmarked(Boolean(bookmarks.data));
    });
    try {
      const saved = JSON.parse(localStorage.getItem(`profile-image-positions:${author?.id}`) || "{}");
      if (saved.avatar) setAvatarPosition(saved.avatar);
    } catch {
      // Keep the centered avatar if local storage is unavailable.
    }
    return () => { active = false; };
  }, [post.id]);
  useEffect(() => {
    if (detail) setShowComments(true);
  }, [detail]);

  const saveActions = (next: Record<string, unknown>) => {
    try {
      const key = `post-actions:${post.id}`;
      const previous = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...previous, ...next }));
    } catch {
      // The UI still works for the current session if storage is unavailable.
    }
  };

  const toggleLike = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const nextLiked = !liked;
    const result = nextLiked
      ? await supabase.from("post_likes").insert({ post_id: post.id, user_id: auth.user.id })
      : await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", auth.user.id);
    if (result.error) return;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikeCount(nextCount);
    saveActions({ liked: nextLiked, likeCount: nextCount });
    onLike?.(post.id);
  };

  const toggleRepost = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const nextReposted = !reposted;
    const result = nextReposted
      ? await supabase.from("post_reposts").insert({ post_id: post.id, user_id: auth.user.id })
      : await supabase.from("post_reposts").delete().eq("post_id", post.id).eq("user_id", auth.user.id);
    if (result.error) return;
    const nextCount = Math.max(0, repostCount + (nextReposted ? 1 : -1));
    setReposted(nextReposted);
    setRepostCount(nextCount);
    saveActions({ reposted: nextReposted, repostCount: nextCount });
  };

  const toggleBookmark = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const nextBookmarked = !bookmarked;
    const result = nextBookmarked
      ? await supabase.from("post_bookmarks").insert({ post_id: post.id, user_id: auth.user.id })
      : await supabase.from("post_bookmarks").delete().eq("post_id", post.id).eq("user_id", auth.user.id);
    if (!result.error) { setBookmarked(nextBookmarked); setBookmarkCount((count) => Math.max(0, count + (nextBookmarked ? 1 : -1))); }
  };

  const addComment = async () => {
    const value = comment.trim();
    if (!value || commentBusy) return;
    setCommentBusy(true);
    setCommentError("");
    if (!fallbackProfile?.id) {
      setCommentError("Você precisa estar conectado para comentar.");
      setCommentBusy(false);
      return;
    }
    const { data, error } = await supabase.from("comments").insert({ post_id: post.id, author_id: fallbackProfile.id, content: value }).select("*,profiles!comments_author_id_fkey(*)").single();
    if (error) {
      setCommentError(error.message.includes("comments") ? "A tabela de comentários ainda não foi configurada no Supabase." : "Não foi possível enviar o comentário.");
      setCommentBusy(false);
      return;
    }
    const nextComment = { id: data.id, text: data.content, createdAt: data.created_at, author: data.profiles || fallbackProfile };
    setComments((current) => [...current, nextComment]);
    setComment("");
    setCommentBusy(false);
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "Publicação", url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Sharing was cancelled or clipboard access was denied.
    }
  };
  return (
    <article id={`post-${post.id}`} className={`post-card${detail ? " post-card-detail" : ""}`} onClick={() => onOpen?.()}>
      <div className="post-avatar-column">
        <Link
          href={author?.id ? `/profile/${author.id}` : "#"}
          onClick={(e) => e.stopPropagation()}
          className="post-avatar"
          style={
            author?.avatar_url
              ? { backgroundImage: `url(${author.avatar_url})`, backgroundPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }
              : undefined
          }
          aria-label={`Abrir perfil de ${author?.display_name || "usuário"}`}
        >
          {!author?.avatar_url && (author?.display_name?.[0] || "A")}
        </Link>
      </div>
      <div className="post-content">
        <header className="post-header">
          <Link
            href={author?.id ? `/profile/${author.id}` : "#"}
            onClick={(e) => e.stopPropagation()}
            className="post-author"
          >
            {author?.display_name || "Usuário"}
          </Link>
          <span className="post-username">
            @{author?.username || "usuario"}
          </span>
          {author?.verified && <BadgeCheck className="verified-badge" size={16} aria-label="Conta verificada" />}
          <span className="post-time">· {relativeTime(post.created_at)}</span>
          <button
            aria-label="Mais opções"
            className="post-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={18} />
          </button>
        </header>
        {post.content && <p className="post-text">{post.content}</p>}
        {media.length > 0 && (
          <div
            className={`post-media-grid media-count-${Math.min(media.length, 4)}`}
          >
            {media.slice(0, 4).map((item: any, index: number) => {
              const url = supabase.storage
                .from("media")
                .getPublicUrl(item.storage_path).data.publicUrl;
              return item.media_type === "video" ? (
                <div
                  key={index}
                  className="post-media-cell video-cell"
                >
                  <VideoPlayer src={url} />
                </div>
              ) : (
                <img
                  key={index}
                  src={url}
                  alt={item.original_name || "Mídia da publicação"}
                  className="post-media-cell"
                />
              );
            })}
          </div>
        )}
        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="Comentar"
            aria-expanded={showComments}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={18} />
            <span>{compact(comments.length)}</span>
          </button>
          <button
            aria-label="Republicar"
            aria-pressed={reposted}
            className={reposted ? "post-action-active post-repost-active" : undefined}
            onClick={toggleRepost}
          >
            <Repeat2 size={18} />
            <span>{compact(repostCount)}</span>
          </button>
          <button
            aria-label="Curtir"
            aria-pressed={liked}
            className={liked ? "post-action-active post-like-active" : undefined}
            onClick={toggleLike}
          >
            <Heart size={18} />
            <span>{compact(likeCount)}</span>
          </button>
          <button aria-label="Visualizações">
            <BarChart3 size={18} />
          </button>
          <button aria-label="Salvar" aria-pressed={bookmarked} className={bookmarked ? "post-action-active" : undefined} onClick={toggleBookmark}>
            <Bookmark size={18} />
            <span>{compact(bookmarkCount)}</span>
          </button>
          <button aria-label="Compartilhar" onClick={sharePost}>
            <Share2 size={18} />
            {shared && <span>Copiado</span>}
          </button>
        </div>
        {showComments && (
          <div className="post-comments" onClick={(e) => e.stopPropagation()}>
            <form className="post-comment-form" onSubmit={(e) => { e.preventDefault(); addComment(); }}>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                aria-label="Escreva um comentário"
                maxLength={280}
              />
              <button type="submit" disabled={commentBusy}>{commentBusy ? "Enviando..." : "Enviar"}</button>
            </form>
            {commentError && <p className="post-comment-error" role="alert">{commentError}</p>}
            {comments.map((item: any, index) => {
              const comment = typeof item === "string"
                ? { id: `${item}-${index}`, text: item, createdAt: new Date().toISOString(), author: fallbackProfile }
                : item;
              const commentAuthor = comment.author || fallbackProfile;
              return (
                <article className="post-comment" key={comment.id}>
                  <div className="post-comment-header">
                    <div
                      className="post-comment-avatar"
                      style={commentAuthor?.avatar_url ? { backgroundImage: `url(${commentAuthor.avatar_url})` } : undefined}
                    >
                      {!commentAuthor?.avatar_url && (commentAuthor?.display_name?.[0] || "A")}
                    </div>
                    <strong>{commentAuthor?.display_name || "Usuário"}</strong>
                    <span>@{commentAuthor?.username || "usuario"} · agora</span>
                    <button type="button" aria-label="Mais opções" className="post-comment-menu">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <p>{comment.text}</p>
                  <div className="post-comment-actions">
                    <button type="button" aria-label="Responder"><MessageCircle size={16} /></button>
                    <button type="button" aria-label="Republicar"><Repeat2 size={16} /></button>
                    <button type="button" aria-label="Curtir"><Heart size={16} /></button>
                    <button type="button" aria-label="Visualizações"><BarChart3 size={16} /></button>
                    <button type="button" aria-label="Salvar"><Bookmark size={16} /></button>
                    <button type="button" aria-label="Compartilhar"><Share2 size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
