import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import type { JournalBackup } from "./model";
import { parseBackup } from "./model";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key) : null;

type Props = {
  getBackup: () => Promise<JournalBackup>;
  replaceJournal: (backup: JournalBackup) => Promise<void>;
};

export default function CloudSync({ getBackup, replaceJournal }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // Revision is set only after a successful pull or our own push.
  const [revision, setRevision] = useState<number | null>(null);
  const [owner, setOwner] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Cloud sync failed. Your local journal is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function currentSession() {
    if (!supabase) throw new Error("Supabase setup is needed first.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error("Please sign in again.");
    setSession(data.session);
    return data.session;
  }

  async function pull() {
    if (!supabase) return;
    const active = await currentSession();
    const { data, error } = await supabase
      .from("journals")
      .select("payload,revision")
      .eq("user_id", active.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      setMessage(
        "No cloud journal yet. Save this device to cloud to create one.",
      );
      return;
    }
    const backup = parseBackup(data.payload);
    if (
      !confirm(
        `Load ${backup.recipes.length} cloud recipes and their photos? This replaces this device’s journal. A recovery copy will be kept.`,
      )
    )
      return;
    await replaceJournal(backup);
    setRevision(data.revision);
    setOwner(active.user.id);
    setMessage(
      "Cloud journal loaded, including photos. This device is up to date.",
    );
  }

  async function push() {
    if (!supabase) return;
    const active = await currentSession();
    const payload = await getBackup();
    if (new Blob([JSON.stringify(payload)]).size > 15 * 1024 * 1024)
      throw new Error(
        "This journal is above the 15 MB cloud limit. Export a local backup and reduce photos before syncing.",
      );
    const expected = owner === active.user.id ? revision : null;
    if (expected === null) {
      // INSERT (never upsert) prevents overwriting an existing journal on first connection.
      const { error } = await supabase
        .from("journals")
        .insert({ user_id: active.user.id, payload, revision: 1 });
      if (error?.code === "23505")
        throw new Error(
          "This account already has a cloud journal. Export this device as a backup, then load the cloud version before saving changes.",
        );
      if (error) throw error;
      setRevision(1);
    } else {
      const { data, error } = await supabase
        .from("journals")
        .update({ payload, revision: expected + 1 })
        .eq("user_id", active.user.id)
        .eq("revision", expected)
        .select("revision");
      if (error) throw error;
      if (!data?.length)
        throw new Error(
          "Another device saved newer changes. Export this device as a backup, then load the latest cloud version. Nothing was overwritten.",
        );
      setRevision(data[0].revision);
    }
    setOwner(active.user.id);
    setMessage(
      "Journal and photos saved to your private cloud account. Load the cloud version on your other device.",
    );
  }

  return (
    <div className="cloud-sync">
      <button
        type="button"
        className="text-button"
        onClick={() => {
          setOpen(!open);
          if (supabase && !open)
            void run(async () => {
              const { data, error } = await supabase.auth.getSession();
              if (error) throw error;
              setSession(data.session);
            });
        }}
      >
        ☁ Sync between devices
      </button>
      {open && (
        <section className="sync-panel" aria-label="Cloud sync">
          <h3>Your journal, together.</h3>
          {!supabase ? (
            <>
              <p>Cloud sync is prepared but not connected yet.</p>
              <p>
                Follow <strong>SUPABASE_SETUP.md</strong> in your project to
                connect your Supabase account. Photos and recipes stay on this
                device until you choose to sync.
              </p>
            </>
          ) : !session ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  if (!supabase) return;
                  if (sent) {
                    const { data, error } = await supabase.auth.verifyOtp({
                      email: email.trim(),
                      token: code.trim(),
                      type: "email",
                    });
                    if (error) throw error;
                    setSession(data.session);
                    setRevision(null);
                    setOwner("");
                    setMessage(
                      "Signed in. Load your cloud journal first if you have used another device.",
                    );
                  } else {
                    const { error } = await supabase.auth.signInWithOtp({
                      email: email.trim(),
                    });
                    if (error) throw error;
                    setSent(true);
                    setMessage("Check your email for your sign-in code.");
                  }
                });
              }}
            >
              <p>Sign in with the same email on your computer and iPad.</p>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  disabled={sent || busy}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {sent && (
                <label>
                  Email code
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
              )}
              <button className="primary" disabled={busy} type="submit">
                {sent ? "Verify code" : "Email me a sign-in code"}
              </button>
              {sent && (
                <button
                  type="button"
                  disabled={busy}
                  className="text-button"
                  onClick={() => {
                    setSent(false);
                    setCode("");
                  }}
                >
                  Use another email / resend
                </button>
              )}
            </form>
          ) : (
            <>
              <p>
                Signed in as <strong>{session.user.email}</strong>
              </p>
              <p>
                Before editing on a different device, load the cloud version.
                When finished, save it back to cloud. Sync is manual.
              </p>
              <div className="sync-actions">
                <button
                  disabled={busy}
                  type="button"
                  onClick={() => void run(pull)}
                >
                  ↓ Load cloud journal
                </button>
                <button
                  disabled={busy}
                  type="button"
                  className="primary"
                  onClick={() => void run(push)}
                >
                  ↑ Save this device to cloud
                </button>
                <button
                  disabled={busy}
                  type="button"
                  className="text-button"
                  onClick={() =>
                    void run(async () => {
                      const { error } = await supabase!.auth.signOut();
                      if (error) throw error;
                      setSession(null);
                      setRevision(null);
                      setOwner("");
                      setSent(false);
                      setMessage(
                        "Signed out. Your journal remains on this device.",
                      );
                    })
                  }
                >
                  Sign out
                </button>
              </div>
            </>
          )}
          {busy && <p role="status">Working…</p>}
          {message && (
            <p role="status" className="sync-message">
              {message}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
