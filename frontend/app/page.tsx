"use client";
import { useEffect, useRef, useState } from "react";
import { supabase, supabaseConfigError } from "../lib/supabase";
import {
  Bell,
  BellRing,
  Bookmark,
  FileImage,
  Heart,
  Home as HomeIcon,
  ImagePlus,
  Menu,
  Send,
  Settings,
  Sparkles,
  Video,
  Search,
  UserRound,
  MessageCircle,
  MoreHorizontal,
  Rocket,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import MobileNavigation from "../components/MobileNavigation";
import PostCard from "../components/PostCard";

type Theme = "white" | "dark";
const normalizeTheme = (theme: string): Theme => theme === "dark" ? "dark" : "white";
const systemTheme = (): Theme => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "white";
const savedTheme = (): Theme => {
  if (typeof window === "undefined") return "white";
  const value = localStorage.getItem("topgo-theme");
  return value === "dark" || value === "white" ? value : systemTheme();
};
type Media = {
  url: string;
  path: string;
  name: string;
  type: "image" | "video";
};
type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  banner_url?: string;
  theme: Theme;
};
type Post = {
  id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
  post_media?: {
    storage_path: string;
    media_type: string;
    original_name: string;
  }[];
};
const mediaBucket = "media";

function friendlyAuthError(message: string) {
  const error = message.toLowerCase();
  if (error.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (error.includes("user already registered")) return "Este e-mail já está cadastrado.";
  if (error.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (error.includes("rate limit") || error.includes("email rate")) return "Muitas tentativas por e-mail. Aguarde alguns minutos e tente novamente.";
  if (error.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (error.includes("unable to validate email")) return "Digite um e-mail válido.";
  return "Não foi possível concluir a operação. Verifique os dados e tente novamente.";
}

function LoadingSpinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function GlowT({ large = false }: { large?: boolean }) {
  const tRef = useRef<HTMLSpanElement>(null);
  const [glow, setGlow] = useState(0);
  const updateGlow = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const target = tRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    const influenceRadius = large ? 560 : 260;
    setGlow(Math.max(0, Math.min(1, 1 - distance / influenceRadius)));
  };
  useEffect(() => {
    window.addEventListener("pointermove", updateGlow);
    return () => window.removeEventListener("pointermove", updateGlow);
  });
  const shade = Math.round(105 + glow * 150);
  const shadow = `0 0 ${3 + glow * 12}px rgba(255,255,255,${0.12 + glow * 0.88}), 0 0 ${glow * 30}px rgba(255,255,255,${glow * 0.72})`;
  return <span ref={tRef} className={`topgo-logo-t ${large ? "auth-mark-t" : ""}`} style={{ color: "transparent", WebkitTextFillColor: "transparent", WebkitTextStroke: `${large ? 2 : 1}px rgb(${shade},${shade},${shade})`, textShadow: shadow }} aria-label="T">T</span>;
}

function TopgoLogo() {
  return <div className="topgo-logo"><GlowT /><span>opgo</span></div>;
}

function AuthNew() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    const nickname = username.trim();
    if (mode === "signup" && (nickname.length < 3 || nickname.length > 16)) { setMessage("O nickname deve ter entre 3 e 16 caracteres."); setBusy(false); return; }
    if (supabaseConfigError) { setMessage(`${supabaseConfigError} Confira o arquivo frontend/.env.local.`); setBusy(false); return; }
    try {
      const result = mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { data: { username: nickname } } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        const errorText = result.error.message.toLowerCase();
        setMessage(errorText.includes("rate limit") || errorText.includes("email rate")
          ? "Muitas tentativas de cadastro. Aguarde alguns minutos ou use outro e-mail."
          : friendlyAuthError(result.error.message));
      }
      else if (mode === "signup") setMessage("Conta criada. Confirme seu e-mail e depois entre.");
    } catch { setMessage("Não foi possível conectar ao Topgo. Verifique sua conexão."); }
    finally { setBusy(false); }
  }
  return <main className="auth-screen"><div className="auth-layout"><form onSubmit={submit} className="auth-card">
    <TopgoLogo /><p className="auth-kicker">Acontecendo agora.</p><p className="auth-subtitle">Entre para continuar no Topgo.</p>
    {mode === "signup" && <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={16} className="auth-input" placeholder="Nickname" required />}
    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="auth-input" placeholder="E-mail" required />
    <div className="auth-password-wrap"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} minLength={6} className="auth-input" placeholder="Senha" required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar" : "Mostrar"}</button></div>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button disabled={busy} className="auth-submit">{busy && <span className="loading-spinner loading-spinner-small" />}{busy ? "Carregando..." : mode === "signup" ? "Criar conta" : "Entrar"}</button>
    {mode === "login" && <button type="button" className="auth-link">Esqueceu sua senha?</button>}
    <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="auth-link">{mode === "signup" ? "Já tenho conta" : "Criar uma conta"}</button>
    <p className="auth-terms">Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade.</p>
  </form><div className="auth-mark" aria-hidden="true"><GlowT large /></div></div></main>;
}

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [username, setUsername] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const nickname = username.trim();
    if (mode === "signup" && (nickname.length < 3 || nickname.length > 16)) {
      setMessage("O nickname deve ter entre 3 e 16 caracteres.");
      return;
    }
    if (supabaseConfigError) {
      setMessage(`${supabaseConfigError} Confira o arquivo frontend/.env.local.`);
      setBusy(false);
      return;
    }
    try {
    if (mode === "signup") {
      const r = await supabase.auth.signUp({
        email,
        password,
          options: { data: { username: nickname } },
      });
      if (r.error) setMessage(r.error.message);
      else setMessage("Conta criada. Confirme seu e-mail e depois entre.");
    } else {
      const r = await supabase.auth.signInWithPassword({ email, password });
      if (r.error) setMessage(r.error.message);
    }
    } catch {
      setMessage("Não foi possível conectar ao Supabase. Verifique a URL do projeto e sua conexão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#0d0b18] p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-line bg-panel p-8"
      >
        <h1 className="font-display text-center text-3xl">topgo</h1>
        {mode === "signup" && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={16}
            className="mt-7 w-full rounded-xl bg-[#100d18] p-3"
            placeholder="Nome de usuário"
            required
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="mt-3 w-full rounded-xl bg-[#100d18] p-3"
          placeholder="E-mail"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          minLength={6}
          className="mt-3 w-full rounded-xl bg-[#100d18] p-3"
          placeholder="Senha"
          required
        />
        <button disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-alert p-3 font-bold text-[#24152a] disabled:cursor-wait disabled:opacity-70">
          {busy && <span className="loading-spinner loading-spinner-small" aria-hidden="true" />}
          {busy ? "Carregando..." : mode === "signup" ? "Criar conta" : "Entrar"}
        </button>
        <p className="mt-3 text-center text-xs text-red-400">{message}</p>
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="w-full text-sm text-neon"
        >
          {mode === "signup" ? "Já tenho conta" : "Criar uma conta"}
        </button>
      </form>
    </main>
  );
}

async function upload(file: File, folder: string) {
  const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
  const r = await supabase.storage
    .from(mediaBucket)
    .upload(path, file, { upsert: false });
  if (r.error) throw r.error;
  return {
    path,
    url: supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl,
  };
}

function Sidebar({
  settings,
  setSettings,
  menu,
  setMenu,
  onLogout,
  onFollow,
  onSaved,
  section,
  setSection,
  profileId,
}: {
  settings: boolean;
  setSettings: (v: boolean) => void;
  menu: boolean;
  setMenu: (v: boolean) => void;
  onLogout: () => void;
  onFollow: () => void;
  onSaved: () => void;
  section: string;
  setSection: (value: "home" | "follow" | "saved") => void;
  profileId: string;
}) {
  return (
    <>
      <aside
        className={`sidebar-x ${menu ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-20 w-60 shrink-0 border-r border-[#2f3336] bg-black p-5 transition-transform lg:static lg:translate-x-0`}
      >
        <div className="mb-12 flex items-center gap-3 font-display text-2xl">
          topgo
        </div>
        <button
          onClick={() => {
            setSettings(false);
            setSection("home");
            setMenu(false);
          }}
          className={`${!settings && section === "home" ? "bg-[#281b50] text-neon" : "text-muted"} flex w-full gap-3 rounded-xl p-4`}
        >
          <HomeIcon />
          Início
        </button>
        <button onClick={onFollow} className={`${section === "follow" ? "bg-[#281b50] text-neon" : "text-muted"} mt-3 flex w-full gap-3 rounded-xl p-4`}><UserPlus /> Seguir</button>
        <button onClick={onSaved} className={`${section === "saved" ? "bg-[#281b50] text-neon" : "text-muted"} mt-3 flex w-full gap-3 rounded-xl p-4`}><Bookmark /> Salvos</button>
        <button
          onClick={() => {
            window.location.href = `/profile/${profileId}`;
            setMenu(false);
          }}
          className={`${settings ? "bg-[#281b50] text-neon" : "text-muted"} mt-3 flex w-full gap-3 rounded-xl p-4`}
        >
          <UserRound />
          Profile
        </button>
      </aside>
      {menu && (
        <button
          onClick={() => setMenu(false)}
          className="fixed inset-0 z-10 bg-black/70 lg:hidden"
        />
      )}
    </>
  );
}

function Home({
  user,
  profile,
  posts,
  setPosts,
}: {
  user: any;
  profile: Profile;
  posts: Post[];
  setPosts: (p: Post[]) => void;
}) {
  const [text, setText] = useState(""),
    [media, setMedia] = useState<Media | null>(null),
    [busy, setBusy] = useState(false),
    [selectedPost, setSelectedPost] = useState<Post | null>(null);
  useEffect(() => {
    const postId = window.location.hash.replace("#post-", "");
    if (!postId) return;
    const timer = window.setTimeout(() => document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    return () => window.clearTimeout(timer);
  }, [posts]);
  const choose = async (e: any, type: "image" | "video") => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    setMedia({ url: preview, path: "", name: f.name, type });
  };
  const publish = async () => {
    if (!text.trim() && !media) return;
    setBusy(true);
    try {
      const p = await supabase
        .from("posts")
        .insert({ author_id: user.id, content: text.trim() })
        .select()
        .single();
      if (p.error) throw p.error;
      let row = p.data;
      if (media) {
        const input = await fetch(media.url).then((r) => r.blob());
        const file = new File([input], media.name, { type: input.type });
        const stored = await upload(file, `posts/${user.id}`);
        const m = await supabase.from("post_media").insert({
          post_id: row.id,
          storage_path: stored.path,
          media_type:
            media.type === "video"
              ? "video"
              : media.name.toLowerCase().endsWith(".gif")
                ? "gif"
                : "image",
          original_name: media.name,
        });
        if (m.error) throw m.error;
        row = {
          ...row,
          post_media: [
            {
              storage_path: stored.path,
              media_type: media.type,
              original_name: media.name,
            },
          ],
        };
      }
      setPosts([row, ...posts]);
      setText("");
      setMedia(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="feed-column min-w-0 flex-1 px-5 lg:px-10">
      <header className="flex h-24 items-center justify-between border-b border-line">
        <div>
          <h1 className="font-display text-3xl">{selectedPost ? "Publicação" : "Início"}</h1>
          <p className="text-sm text-muted">{selectedPost ? "Detalhes da publicação" : "Nosso cantinho no mundo."}</p>
        </div>
        <Bell />
      </header>
      {selectedPost ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setSelectedPost(null)}
            className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-neon"
          >
            ← Voltar ao feed
          </button>
          <PostCard
            key={`detail-${selectedPost.id}`}
            post={selectedPost}
            fallbackProfile={profile}
            detail
          />
        </div>
      ) : (
      <>
      <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          className="h-24 w-full resize-none bg-transparent outline-none"
          placeholder="O que está no seu coração?"
        />
        {media && (
          <div className="mb-4 overflow-hidden rounded-xl border border-line p-2">
            {media.type === "video" ? (
              <video src={media.url} controls className="max-h-56 w-full" />
            ) : (
              <img
                src={media.url}
                alt={media.name}
                className="max-h-56 w-full object-contain"
              />
            )}
            <small className="text-neon">{media.name}</small>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <div className="flex gap-3 text-neon">
            <label className="media-option">
              <FileImage />
              <span className="media-tooltip">Imagem</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => choose(e, "image")}
              />
            </label>
            <label className="media-option">
              <Sparkles />
              <span className="media-tooltip">GIF</span>
              <input
                type="file"
                accept="image/gif"
                className="hidden"
                onChange={(e) => choose(e, "image")}
              />
            </label>
            <label className="media-option">
              <Video />
              <span className="media-tooltip">Vídeo</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => choose(e, "video")}
              />
            </label>
          </div>
          <button
            disabled={busy}
            onClick={publish}
            className="flex gap-2 rounded-xl bg-[#8c4cff] px-5 py-3 disabled:opacity-50"
          >
            <Send />
            {busy ? "Enviando..." : "Publicar"}
          </button>
        </div>
      </div>
      {posts.length ? (
        posts.map((p) => (
          <PostCard key={p.id} post={p} fallbackProfile={profile} onOpen={() => setSelectedPost(p)} />
        ))
      ) : (
        <div className="grid min-h-48 place-items-center text-muted">
          <Sparkles />
          <p>Ainda não há publicações.</p>
        </div>
      )}
      </>
      )}
    </section>
  );
}

type ImagePosition = { x: number; y: number };
type CropKind = "banner" | "avatar";
type CropResult = { url: string; position: ImagePosition; zoom: number };

function CropEditorModal({
  source,
  kind,
  onCancel,
  onApply,
}: {
  source: string;
  kind: CropKind;
  onCancel: () => void;
  onApply: (result: CropResult) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; imageX: number; imageY: number } | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);

  const limits = (nextZoom = zoom) => ({
    x: Math.max(0, baseSize.width * nextZoom - areaSize.width),
    y: Math.max(0, baseSize.height * nextZoom - areaSize.height),
  });
  const clampPosition = (x: number, y: number, nextZoom = zoom) => {
    const max = limits(nextZoom);
    return {
      x: Math.max(-max.x, Math.min(0, x)),
      y: Math.max(-max.y, Math.min(0, y)),
    };
  };
  const setEditorZoom = (next: number) => {
    const value = Math.max(1, Math.min(3, next));
    setZoom(value);
    setPosition((current) => clampPosition(current.x, current.y, value));
  };
  const setStageSize = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    setAreaSize({ width: rect.width, height: rect.height });
  };

  useEffect(() => {
    setStageSize();
    const observer = new ResizeObserver(setStageSize);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const imageLoaded = (event: any) => {
    const image = event.currentTarget as HTMLImageElement;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const areaRatio = rect.width / rect.height;
    const width = imageRatio > areaRatio ? rect.height * imageRatio : rect.width;
    setAreaSize({ width: rect.width, height: rect.height });
    setBaseSize({ width, height: width / imageRatio });
    setPosition({ x: (rect.width - width) / 2, y: (rect.height - width / imageRatio) / 2 });
    setLoaded(true);
  };

  const getDistance = () => {
    const values = Array.from(pointers.current.values());
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  };
  const pointerDown = (event: any) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: event.clientX, y: event.clientY, imageX: position.x, imageY: position.y };
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      pinchStart.current = { distance: getDistance(), zoom };
    }
  };
  const pointerMove = (event: any) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && pinchStart.current) {
      const distance = getDistance();
      if (pinchStart.current.distance) setEditorZoom(pinchStart.current.zoom * distance / pinchStart.current.distance);
      return;
    }
    if (!dragStart.current) return;
    setPosition(clampPosition(
      dragStart.current.imageX + event.clientX - dragStart.current.x,
      dragStart.current.imageY + event.clientY - dragStart.current.y,
    ));
  };
  const pointerUp = (event: any) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (!pointers.current.size) dragStart.current = null;
  };
  const apply = () => {
    const max = limits();
    onApply({
      url: source,
      position: {
        x: max.x ? (-position.x / max.x) * 100 : 50,
        y: max.y ? (-position.y / max.y) * 100 : 50,
      },
      zoom,
    });
  };

  return (
    <div className="crop-modal-backdrop" role="dialog" aria-modal="true" aria-label="Ajustar imagem">
      <div className="crop-modal">
        <div className="crop-modal-header">
          <div>
            <h2>Ajustar {kind === "avatar" ? "foto de perfil" : "banner"}</h2>
            <p>Arraste para reposicionar · use o scroll ou a pinça para zoom</p>
          </div>
          <button type="button" className="crop-close" onClick={onCancel} aria-label="Fechar">×</button>
        </div>
        <div
          ref={stageRef}
          className={`crop-stage crop-stage-${kind}`}
          onWheel={(event) => { event.preventDefault(); setEditorZoom(zoom - event.deltaY * 0.002); }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
        >
          <img
            src={source}
            alt="Prévia do recorte"
            onLoad={imageLoaded}
            className="crop-image"
            style={{
              width: baseSize.width ? baseSize.width * zoom : "100%",
              height: baseSize.height ? baseSize.height * zoom : "100%",
              transform: `translate(${position.x}px, ${position.y}px)`,
              visibility: loaded ? "visible" : "hidden",
            }}
            draggable={false}
          />
          <div className={`crop-mask crop-mask-${kind}`} />
        </div>
        <div className="crop-zoom-control">
          <span>−</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setEditorZoom(Number(event.target.value))} aria-label="Zoom" />
          <span>+</span>
        </div>
        <div className="crop-modal-actions">
          <button type="button" className="crop-cancel" onClick={onCancel}>Cancelar</button>
          <button type="button" className="crop-apply" onClick={apply} disabled={!loaded}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({
  profile,
  setProfile,
  setTheme,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  setTheme: (t: Theme) => void;
}) {
  const [banner, setBanner] = useState(profile.banner_url || ""),
    [avatar, setAvatar] = useState(profile.avatar_url || ""),
    [bannerPosition, setBannerPosition] = useState<ImagePosition>({ x: 50, y: 50 }),
    [avatarPosition, setAvatarPosition] = useState<ImagePosition>({ x: 50, y: 50 }),
    [bannerZoom, setBannerZoom] = useState(1),
    [avatarZoom, setAvatarZoom] = useState(1),
    [crop, setCrop] = useState<{ kind: CropKind; source: string } | null>(null),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`profile-image-positions:${profile.id}`) || "{}");
      if (saved.banner) setBannerPosition(saved.banner);
      if (saved.avatar) setAvatarPosition(saved.avatar);
      if (saved.bannerZoom) setBannerZoom(saved.bannerZoom);
      if (saved.avatarZoom) setAvatarZoom(saved.avatarZoom);
    } catch {
      // Keep the centered position if local storage is unavailable.
    }
  }, [profile.id]);
  const openCrop = (event: any, kind: CropKind) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCrop({ kind, source: URL.createObjectURL(file) });
    event.target.value = "";
  };
  const changeImagePosition = (kind: CropKind, position: ImagePosition, zoom: number) => {
    if (kind === "banner") setBannerPosition(position);
    else setAvatarPosition(position);
    if (kind === "banner") setBannerZoom(zoom);
    else setAvatarZoom(zoom);
    try {
      const key = `profile-image-positions:${profile.id}`;
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...saved, [kind]: position, [`${kind}Zoom`]: zoom }));
    } catch {
      // The preview still updates for the current session.
    }
  };
  const save = async () => {
    setSaving(true);
    try {
      let next = { ...profile, banner_url: banner, avatar_url: avatar };
      if (banner.startsWith("blob:")) {
        const r = await fetch(banner);
        const f = new File([await r.blob()], "banner.jpg");
        const x = await upload(f, `profiles/${profile.id}`);
        next.banner_url = x.url;
      }
      if (avatar.startsWith("blob:")) {
        const r = await fetch(avatar);
        const f = new File([await r.blob()], "avatar.jpg");
        const x = await upload(f, `profiles/${profile.id}`);
        next.avatar_url = x.url;
      }
      let result = await supabase
        .from("profiles")
        .upsert(next)
        .select()
        .single();
      if (result.error?.code === "23514" && result.error.message.includes("profiles_theme_check")) {
        result = await supabase
          .from("profiles")
          .upsert({ ...next, theme: next.theme === "dark" ? "tokyo" : "evangelion" })
          .select()
          .single();
      }
      if (result.error) throw result.error;
      setProfile({ ...result.data, theme: normalizeTheme(next.theme) });
      setTheme(savedTheme());
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="feed-column min-w-0 flex-1 bg-[#0d0b18] px-5 py-6 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl">Configuração de Conta</h1>
        <div className="mt-8">
          {banner ? (
            <div className="profile-image-preview profile-banner-preview">
              <img src={banner} alt="Prévia do banner" style={{ objectPosition: `${bannerPosition.x}% ${bannerPosition.y}%`, transform: `scale(${bannerZoom})` }} />
            </div>
          ) : (
            <div className="image-position-editor image-position-banner bg-gradient-to-br from-[#24164a] to-[#f28b36]" />
          )}
          <label
            htmlFor="banner"
            className="relative -mt-14 ml-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-black/60 px-3 py-2"
          >
            <ImagePlus className="inline" /> Banner
            <input
              id="banner"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => openCrop(e, "banner")}
            />
          </label>
        </div>
        <div className="-mt-12 mb-8 ml-2 h-24 w-24 rounded-full border-4 border-[#0d0b18] bg-[#35265e] text-neon">
          {avatar ? (
            <div className="profile-image-preview profile-avatar-preview">
              <img src={avatar} alt="Prévia do avatar" style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`, transform: `scale(${avatarZoom})` }} />
            </div>
          ) : (
            <label htmlFor="avatar" className="grid h-full w-full cursor-pointer place-items-center rounded-full">
              <ImagePlus />
            </label>
          )}
        </div>
        {avatar && (
          <label htmlFor="avatar" className="-mt-5 mb-6 ml-3 block w-fit cursor-pointer text-xs text-neon">
            Trocar foto de perfil
          </label>
        )}
        <input
          id="avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            openCrop(e, "avatar")
          }
        />
        <input
          value={profile.display_name}
          onChange={(e) =>
            setProfile({ ...profile, display_name: e.target.value })
          }
          className="w-full rounded-xl bg-[#100d18] p-3"
          placeholder="Nome"
        />
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          className="mt-4 w-full rounded-xl bg-[#100d18] p-3"
          rows={4}
          placeholder="Bio"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { localStorage.setItem("topgo-theme", "white"); setProfile({ ...profile, theme: "white" }); setTheme("white"); }}
            className="h-20 rounded-xl border border-green bg-cover font-bold"
            style={{ background: "#ffffff", color: "#111111" }}
          >
            White
          </button>
          <button
            type="button"
            onClick={() => { localStorage.setItem("topgo-theme", "dark"); setProfile({ ...profile, theme: "dark" }); setTheme("dark"); }}
            className="h-20 rounded-xl border border-line bg-cover font-bold"
            style={{ background: "#111111", color: "#ffffff" }}
          >
            Dark
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-alert p-3 font-bold"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {crop && (
        <CropEditorModal
          source={crop.source}
          kind={crop.kind}
          onCancel={() => {
            URL.revokeObjectURL(crop.source);
            setCrop(null);
          }}
          onApply={(result) => {
            if (crop.kind === "banner") setBanner(result.url);
            else setAvatar(result.url);
            changeImagePosition(crop.kind, result.position, result.zoom);
            setCrop(null);
          }}
        />
      )}
    </section>
  );
}

function FollowPanel({ user }: { user: any }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*").neq("id", user.id).limit(30),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
    ]).then(([people, relations]) => {
      setProfiles(people.data || []);
      setFollowing(new Set((relations.data || []).map((row: any) => row.following_id)));
    });
  }, [user.id]);
  const toggle = async (id: string) => {
    const isFollowing = following.has(id);
    const result = isFollowing
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id)
      : await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    if (!result.error) setFollowing((current) => { const next = new Set(current); isFollowing ? next.delete(id) : next.add(id); return next; });
  };
  return <section className="feed-column min-w-0 flex-1 px-5 lg:px-10"><header className="flex h-24 items-center border-b border-line"><div><h1 className="font-display text-3xl">Seguir</h1><p className="text-sm text-muted">Encontre pessoas para acompanhar.</p></div></header><div className="mt-7 border-b border-line pb-4 text-neon">Quem seguir</div><div className="mt-4 grid gap-3">{profiles.map((person) => <div key={person.id} className="flex items-center justify-between rounded-2xl border border-line bg-panel p-4"><div className="flex min-w-0 items-center gap-3"><div className="post-avatar" style={person.avatar_url ? { backgroundImage: `url(${person.avatar_url})` } : undefined}>{!person.avatar_url && (person.display_name?.[0] || "A")}</div><div><strong>{person.display_name}</strong>{person.verified && <ShieldCheck size={15} className="ml-2 inline text-neon" />}<p className="text-sm text-muted">@{person.username}</p></div></div><button onClick={() => toggle(person.id)} className="rounded-xl bg-alert px-4 py-2 text-sm font-bold">{following.has(person.id) ? "Seguindo" : "Seguir"}</button></div>)}</div><div className="mt-8 border-b border-line pb-4 text-neon">Criadores para você</div></section>;
}

function SavedPanel({ user, profile }: { user: any; profile: Profile }) {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => { (async () => { const saved = await supabase.from("post_bookmarks").select("post_id").eq("user_id", user.id); const ids = (saved.data || []).map((row: any) => row.post_id); if (!ids.length) return; const result = await supabase.from("posts").select("*,profiles!posts_author_id_fkey(*),post_media!post_media_post_id_fkey(*)").in("id", ids).order("created_at", { ascending: false }); setPosts(result.data || []); })(); }, [user.id]);
  return <section className="feed-column min-w-0 flex-1 px-5 lg:px-10"><header className="flex h-24 items-center border-b border-line"><h1 className="font-display text-3xl">Salvos</h1></header><div className="mt-6">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} fallbackProfile={profile} />) : <p className="mt-8 text-muted">Você ainda não salvou nenhuma publicação.</p>}</div></section>;
}

export default function Page() {
  const [user, setUser] = useState<any>(null),
    [authReady, setAuthReady] = useState(false),
    [profile, setProfile] = useState<Profile | null>(null),
    [posts, setPosts] = useState<Post[]>([]),
    [loadError, setLoadError] = useState(""),
    [settings, setSettings] = useState(false),
    [menu, setMenu] = useState(false),
    [section, setSection] = useState<"home" | "follow" | "saved">("home"),
    [theme, setTheme] = useState<Theme>("white");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));
    const x = supabase.auth.onAuthStateChange((_, s) =>
      setUser(s?.user || null),
    );
    return () => x.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
      let p = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (p.error && p.error.code !== "PGRST116") throw p.error;
      if (!p.data) {
        await supabase.from("profiles").insert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split("@")[0],
          display_name: user.user_metadata?.username || "topgo",
          bio: "",
          theme: "white",
        });
        p = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
      }
      if (p.error) throw p.error;
      if (p.data) {
        setProfile(p.data);
        setTheme(savedTheme());
      }
      const r = await supabase
        .from("posts")
        .select("*,profiles!posts_author_id_fkey(*),post_media!post_media_post_id_fkey(*)")
        .order("created_at", { ascending: false });
      if (r.error) throw r.error;
      setPosts(r.data || []);
      } catch (error: any) {
        setLoadError(error?.message || "Não foi possível carregar sua conta.");
      }
    })();
  }, [user]);
  if (loadError)
    return (
      <div className="grid min-h-screen place-items-center bg-[#0d0b18] p-6 text-center">
        <div>
          <p className="text-red-400">Erro ao carregar sua conta:</p>
          <p className="mt-2 text-sm text-white">{loadError}</p>
          <button className="mt-5 rounded-xl bg-alert px-5 py-3" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  if (!authReady)
    return <div className="grid min-h-screen place-items-center bg-[#0d0b18]"><LoadingSpinner /></div>;
  if (!user || !profile)
    return user ? (
      <div className="grid min-h-screen place-items-center bg-[#0d0b18]">
        <LoadingSpinner />
      </div>
    ) : (
      <AuthNew />
    );
  return (
    <main data-theme={theme}
      className="h-dvh min-h-0 overflow-hidden bg-cover bg-center"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1260px] flex-col lg:flex-row lg:justify-center">
        <header className="flex h-16 items-center gap-4 border-b border-line px-5 lg:hidden">
          <button onClick={() => setMenu(true)}>
            <Menu />
          </button>
          topgo
        </header>
        <Sidebar
          settings={settings}
          setSettings={setSettings}
          menu={menu}
          setMenu={setMenu}
          onLogout={() => supabase.auth.signOut()}
          onFollow={() => { setSettings(false); setSection("follow"); setMenu(false); }}
          onSaved={() => { setSettings(false); setSection("saved"); setMenu(false); }}
          section={section}
          setSection={setSection}
          profileId={profile.id}
        />
        {settings ? (
          <SettingsPage
            profile={profile}
            setProfile={setProfile}
            setTheme={setTheme}
          />
        ) : section === "follow" ? (
          <FollowPanel user={user} />
        ) : section === "saved" ? (
          <SavedPanel user={user} profile={profile} />
        ) : (
          <Home
            user={user}
            profile={profile}
            posts={posts}
            setPosts={setPosts}
          />
        )}
      </div>
      <MobileNavigation
        settings={settings}
        onHome={() => { setSettings(false); setSection("home"); }}
        onSettings={() => setSettings(true)}
      />
    </main>
  );
}
