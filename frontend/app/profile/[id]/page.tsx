"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Heart, UserPlus, UserMinus, UserRound, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [viewer, setViewer] = useState<any>(null);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setViewer(auth.user);
      const profileResult = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single();
      setProfile(profileResult.data);
      setDraft(profileResult.data);
      const [followersResult, followingResult] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", params.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", params.id),
      ]);
      setFollowers(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
      if (auth.user && auth.user.id !== params.id) {
        const relation = await supabase.from("follows").select("follower_id").eq("follower_id", auth.user.id).eq("following_id", params.id).maybeSingle();
        setFollowing(Boolean(relation.data));
      }
      const postsResult = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", params.id)
      .order("created_at", { ascending: false });
      setPosts(postsResult.data || []);
    };
    load();
  }, [params.id]);
  const toggleFollow = async () => {
    if (!viewer || followBusy) return;
    setFollowBusy(true);
    const result = following
      ? await supabase.from("follows").delete().eq("follower_id", viewer.id).eq("following_id", params.id)
      : await supabase.from("follows").insert({ follower_id: viewer.id, following_id: params.id });
    if (!result.error) {
      setFollowing(!following);
      setFollowers(followers + (following ? -1 : 1));
    }
    setFollowBusy(false);
  };
  const saveProfile = async () => {
    if (!draft) return;
    setSaving(true);
    const { data, error } = await supabase.from("profiles").update({ display_name: draft.display_name, bio: draft.bio, location: draft.location, avatar_url: draft.avatar_url, banner_url: draft.banner_url }).eq("id", params.id).select().single();
    if (!error && data) { setProfile(data); setDraft(data); setEditing(false); }
    setSaving(false);
  };
  const uploadImage = async (event: any, field: "avatar_url" | "banner_url") => {
    const file = event.target.files?.[0];
    if (!file || !viewer || viewer.id !== params.id) return;
    const path = `profiles/${params.id}/${field}-${crypto.randomUUID()}-${file.name}`;
    const result = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (!result.error) setDraft((current: any) => ({ ...current, [field]: supabase.storage.from("media").getPublicUrl(path).data.publicUrl }));
  };
  if (!profile)
    return (
      <main className="grid h-dvh place-items-center bg-[#0d0b18] text-muted">
        Carregando perfil...
      </main>
    );
  return (
    <main className="h-dvh min-h-0 overflow-hidden bg-[#0d0b18] text-ink">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1260px] lg:justify-center">
        <aside className="hidden h-full w-60 shrink-0 border-r border-[#2f3336] bg-black p-5 lg:block">
          <a href="/" className="mb-12 flex items-center gap-3 font-display text-2xl">
            topgo
          </a>
          <a
            href="/"
            className="flex w-full gap-3 rounded-xl bg-[#281b50] p-4 text-neon"
          >
            <ArrowLeft /> Voltar ao início
          </a>
        </aside>
        <section className="h-full min-h-0 w-full max-w-[600px] overflow-y-auto px-5 py-5 lg:px-10 lg:py-12">
        <button
          onClick={() => history.back()}
          className="mb-6 flex items-center gap-2 text-muted hover:text-neon"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        <section className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div
            style={
              profile.banner_url
                ? { backgroundImage: `url(${profile.banner_url})` }
                : undefined
            }
            className="h-44 bg-gradient-to-br from-[#24164a] to-[#f28b36] bg-cover bg-center"
          />
          <div className="-mt-12 px-6 pb-6">
            <div
              style={
                profile.avatar_url
                  ? { backgroundImage: `url(${profile.avatar_url})` }
                  : undefined
              }
              className="grid h-24 w-24 place-items-center rounded-full border-4 border-panel bg-[#35265e] bg-cover bg-center text-2xl text-neon"
            >
              {!profile.avatar_url && <Heart />}
            </div>
            <h1 className="mt-4 font-display text-3xl">
              {profile.display_name}
            </h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            <p className="mt-4">{profile.bio}</p>
            {profile.location && <p className="mt-2 text-sm text-muted">📍 {profile.location}</p>}
            <div className="mt-5 flex items-center gap-6 text-sm text-muted">
              <span><strong className="text-ink">{followers}</strong> seguidores</span>
              <span><strong className="text-ink">{followingCount}</strong> seguindo</span>
            </div>
            {viewer && viewer.id !== params.id && (
              <button onClick={toggleFollow} disabled={followBusy} className="mt-5 flex items-center gap-2 rounded-xl bg-alert px-5 py-3 font-bold text-[#24152a] disabled:opacity-60">
                {following ? <UserMinus size={18} /> : <UserPlus size={18} />}
                {following ? "Deixar de seguir" : "Seguir"}
              </button>
            )}
            {viewer?.id === params.id && <button onClick={() => setEditing(true)} className="mt-5 rounded-xl border border-line px-5 py-3 font-bold">Editar perfil</button>}
          </div>
        </section>
        <h2 className="mt-8 border-b border-line pb-4 font-display text-xl">
          Publicações
        </h2>
        {posts.map((post) => (
          <article
            key={post.id}
            className="my-4 rounded-2xl border border-line bg-panel p-5"
          >
            <p>{post.content}</p>
          </article>
        ))}
        </section>
      </div>
      {editing && draft && <div className="profile-editor-backdrop"><section className="profile-editor"><header><button onClick={() => setEditing(false)} aria-label="Fechar"><X /></button><strong>Editar perfil</strong><button onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button></header><label className="profile-editor-banner" style={draft.banner_url ? { backgroundImage: `url(${draft.banner_url})` } : undefined}><input type="file" accept="image/*" onChange={(e) => uploadImage(e, "banner_url")} /><span>Trocar banner</span></label><label className="profile-editor-avatar" style={draft.avatar_url ? { backgroundImage: `url(${draft.avatar_url})` } : undefined}>{!draft.avatar_url && <UserRound />}<input type="file" accept="image/*" onChange={(e) => uploadImage(e, "avatar_url")} /></label><input value={draft.display_name || ""} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} placeholder="Nome" /><textarea value={draft.bio || ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Bio" /><input value={draft.location || ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Localização" /></section></div>}
    </main>
  );
}
