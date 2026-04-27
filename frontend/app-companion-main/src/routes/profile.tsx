import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Camera, Save, Mail, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — IntelliFence" },
      { name: "description", content: "Edit your IntelliFence profile, avatar, and personal information." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateUser, isAuthenticated } = useApp();

  // Local form state mirrors context so we can cancel edits
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md glass rounded-2xl p-10">
            <h1 className="text-2xl font-bold">You're not signed in</h1>
            <p className="text-muted-foreground mt-2 mb-6">Sign in to view and edit your profile.</p>
            <Button variant="hero" asChild><Link to="/login">Sign in</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview only — no upload in this demo
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, bio, avatarUrl });
    toast.success("Profile updated");
  };

  const initials = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header band */}
        <div className="relative h-48 sm:h-56 bg-gradient-hero overflow-hidden">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.7_0.05_270/0.4)_1px,transparent_0)] [background-size:32px_32px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-16">
          <div className="bg-gradient-card glass rounded-3xl shadow-elegant p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="h-28 w-28 rounded-2xl bg-gradient-primary p-1 shadow-glow">
                  <div className="h-full w-full rounded-xl bg-card flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-gradient">{initials}</span>
                    )}
                  </div>
                </div>
                <label className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-glow hover:scale-110 transition-smooth">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleAvatar} className="sr-only" />
                </label>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold">{name || "Your name"}</h1>
                <p className="text-muted-foreground">{email}</p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{bio || "Add a short bio so people know who you are."}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-10 grid sm:grid-cols-2 gap-5">
              <Field
                label="Full name"
                icon={<User className="h-4 w-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Field
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <div className="relative flex items-start rounded-lg border border-border bg-input/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 transition-smooth">
                  <span className="pl-3 pt-3 text-muted-foreground"><FileText className="h-4 w-4" /></span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell us about yourself…"
                    maxLength={280}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 resize-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{bio?.length ?? 0}/280</p>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => {
                  if (user) { setName(user.name); setEmail(user.email); setBio(user.bio); setAvatarUrl(user.avatarUrl); }
                }}>Cancel</Button>
                <Button type="submit" variant="hero">
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
