**# Puja Prem — Audio Architecture**

A Bengali Durga Puja playlist that plays forever. \*\*This document is only about how
the audio plays.\*\*

Out of scope by intent: UI, UX, layout, styling, deployment, hosting, analytics, SEO,
sound-effect layers. Everything here is the playback machine.

Mechanism details in §1–§9 are read out of busdriver.wtf's shipped production bundle,
so the constants are real. §10 onward is what a Puja playlist needs that a highway
playlist doesn't.

**---**

**## 0. The shape of it**

\`\`\`
                    ┌──────────────────────────────────────────┐
   user gesture ───▶│  1×1px INVISIBLE YouTube iframe          │
                    │  the only thing that makes sound         │
                    └───────────────┬──────────────────────────┘
                                    │ onStateChange(0 = ENDED)
                                    ▼
                           index = next(index)          ◀── repeat mode decides
                                    │
                                    ▼
                          player.loadVideoById(id)
                                    │
                                    └───▶ plays ───▶ ENDED ───▶ ⟲ forever


   satellites, all driven off one 250ms poll:

   getCurrentTime() ─┬─▶ progress
                     ├─▶ Math.floor() ─▶ localStorage        (1 write/sec)
                     ├─▶ Math.floor() ─▶ mediaSession position
                     ├─▶ end-of-track fade                   (§8.2)
                     └─▶ stall watchdog                      (§10)

   silent 8kHz WAV ──▶ \<audio loop> ──▶ iOS keeps the audio session + lock screen
   BroadcastChannel ─▶ only one tab is allowed to play        (§11)
\`\`\`

**\*\*The one sentence that matters:\*\*** the entire "never stops playing" product is one
event handler — \`ENDED → next index\`. Build that first. Everything else in this
document is hardening around it.

**---**

**## 1. The player is a hidden iframe**

There is no \`\<audio>\` element playing music. There is a \*\*1×1 pixel transparent
YouTube iframe\*\*, and sound comes out of it.

\`\`\`jsx
\<div ref={hostRef}
     style={{ position:'absolute', left:0, top:0, width:1, height:1, opacity:0, pointerEvents:'none' }}
     aria-hidden="true" />
\`\`\`

\`YT.Player\` replaces that node with an \`\<iframe>\`:

\`\`\`js
new window\.YT.Player(hostRef.current, {
  videoId,
  playerVars: {
    controls: 0,
    disablekb: 1,        // YouTube must not capture our keys
    playsinline: 1,      // ⬅ CRITICAL: without it iOS hijacks into fullscreen video
    rel: 0,
    modestbranding: 1,
    enablejsapi: 1,      // ⬅ CRITICAL: without it every control method silently no-ops
    origin: window\.location.origin,
  },
  events: { onReady, onStateChange, onError },
})
\`\`\`

Those two flags are the difference between working and mysteriously not working.

**### 1.1 Load the API lazily, exactly once**

\`\`\`js
useEffect(() => {
  let cancelled = false

  const init = () => {
    if (cancelled || !hostRef.current || !window\.YT?.Player) return
    lastLoadedId.current = videoIdRef.current
    playerRef.current = new window\.YT.Player(hostRef.current, { /\* …as above… \*/ })
  }

  if (window\.YT?.Player) {
    init()                                    // already loaded (client-side nav)
  } else {
    if (!document.querySelector('script[src="https\://www\.youtube.com/iframe\_api"]')) {
      const s = document.createElement('script')
      s.src = 'https\://www\.youtube.com/iframe\_api'
      s.async = true
      document.head.appendChild(s)
    }
    window\.onYouTubeIframeAPIReady = init     // YouTube calls this global, by name
  }

  return () => { cancelled = true; playerRef.current?.destroy(); playerRef.current = null }
}, [])   // ⬅ EMPTY DEPS. one player for the whole session.
\`\`\`

\- **\*\*\`window\.onYouTubeIframeAPIReady\` is a single global slot.\*\*** If two components
  assign it, one silently loses. Exactly one hook may own it.
\- **\*\*The \`querySelector\` guard\*\*** stops a duplicate \`\<script>\` on remount, which would
  re-fire the global and build a second player — two players, two songs, at once.
\- **\*\*The \`cancelled\` flag\*\*** handles React 18 StrictMode's double-invoked effects.

Warm the connection so the handshake isn't on the critical path when they press play:

\`\`\`html
\<link rel="preconnect" href="https\://www\.youtube.com">
\<link rel="preconnect" href="https\://i.ytimg.com">   \<!-- lock-screen artwork -->
\`\`\`

**### 1.2 Track changes never rebuild the player**

\`\`\`js
useEffect(() => {
  if (!playerRef.current || !videoId) return
  if (videoId === lastLoadedId.current) return    // guard re-entry
  lastLoadedId.current = videoId
  playerRef.current.loadVideoById(videoId)        // loads AND plays
}, [videoId])
\`\`\`

\`loadVideoById\` plays immediately; \`cueVideoById\` loads and waits. Use the former
mid-playlist.

**\*\*Never destroy and recreate the player per track.\*\*** It drops the mobile audio session
and re-triggers autoplay restrictions on every single song.

\> ⚠️ **\*\*Accepted risk:\*\*** a hidden audio-only YouTube player violates YouTube's ToS (the
\> player is meant to be visible, ≥200×200px). You chose to mirror busdriver. The
\> mitigation is structural — see §16.

**---**

**## 2. The state machine**

\`onStateChange\` gives you a bare integer:

\| Code | Meaning | Action |
\| --- | --- | --- |
\| \`-1\` | UNSTARTED | ignore |
\| \`0\` | **\*\*ENDED\*\*** | **\*\*advance\*\*** — see §3 |
\| \`1\` | PLAYING | \`setPlaying(true)\`; run the one-shot resume seek; reset the watchdog |
\| \`2\` | PAUSED | \`setPlaying(false)\` |
\| \`3\` | BUFFERING | ignore for play state; **\*\*arm the stall watchdog\*\*** (§10) |
\| \`5\` | CUED | run the one-shot resume seek |

\`\`\`js
const handleStateChange = useCallback((code) => {
  if (code === 1 || code === 5) resumeOnce()
  if (code === 1) { setPlaying(true);  clearStall() }
  if (code === 2) { setPlaying(false) }
  if (code === 3) { armStall() }                        // §10
  if (code === 0) { setPlaying(false); advance('ended') }
}, [resumeOnce, advance])
\`\`\`

**\*\*Do not map BUFFERING to paused.\*\*** It fires constantly on mobile networks and makes
your play state strobe.

**\*\*Why auto-advance needs no second gesture:\*\*** playback was already user-initiated on
this iframe, so YouTube's autoplay policy is satisfied for the session. A programmatic
\`loadVideoById\` after ENDED plays immediately. This is also precisely why you can never
autoplay the *\*first\** track (§7).

**---**

**## 3. Advancing, and repeat modes**

A Puja playlist wants three modes. Mahalaya on loop is a real listening pattern, so
\`repeat: 'one'\` is not decoration.

\`\`\`ts
type Repeat = 'all' | 'one' | 'off'
\`\`\`

\`\`\`js
const advance = useCallback((reason) => {
  setTime(0); setDuration(0)

  if (reason === 'ended' && repeat === 'one') {
    playerRef.current?.seekTo(0, true)      // re-seek, don't reload — instant, no buffer
    playerRef.current?.playVideo()
    return
  }

  const last = index >= tracks.length - 1
  if (last && repeat === 'off' && reason === 'ended') {
    setPlaying(false)                       // playlist finished; stop cleanly
    return
  }
  setIndex(last ? 0 : index + 1)
}, [index, tracks.length, repeat])
\`\`\`

**\*\*\`repeat: 'one'\` seeks rather than reloads.\*\*** \`loadVideoById\` on the same ID tears
down and re-buffers the stream — a 1–3 second hole. \`seekTo(0, true)\` on an
already-loaded video is instant.

A manual \`next()\` always advances even under \`repeat: 'one'\` — pass a different
\`reason\`. Repeat mode governs what happens when a track *\*ends by itself\**, not what
happens when a human asks for the next song.

Persist the mode: \`pujoprem\:repeat\:v1\`.

**---**

**## 4. Dead videos heal themselves**

The #1 reliability problem with a YouTube-backed playlist, and it fails silently unless
you handle \`onError\`. Bengali devotional uploads are especially prone to it — small
channels, frequent takedowns, embedding disabled by default on many.

\`\`\`js
const FATAL = new Set([2, 5, 100, 101, 150])
// 2   = malformed parameter
// 5   = HTML5 player error
// 100 = video removed or private
// 101 / 150 = embedding disabled by the uploader   ⬅ overwhelmingly the common case

const dead = useRef(new Set())

const handleError = useCallback((code) => {
  if (!FATAL.has(code) || !currentId) return
  dead.current.add(currentId)
  setPlaying(false); setTime(0); setDuration(0)

  for (let step = 1; step <= tracks.length; step += 1) {   // ⬅ BOUNDED
    const probe = (index + step) % tracks.length
    if (!dead.current.has(tracks[probe].id)) return setIndex(probe)
  }
  // every track is dead → stop. do not recurse.
}, [index, currentId, tracks])
\`\`\`

**\*\*The bounded loop is the entire safety property.\*\*** Naive "skip to the next one"
recursion pins the CPU at 100% the instant a whole playlist is unavailable — which is
exactly what happens when a listener opens the site from outside India and every video
is region-blocked.

The blacklist lives in a \`useRef\`, so it's session-scoped: a video that failed from a
transient network blip gets another chance on reload.

**\*\*Kill most of this at authoring time.\*\*** When you enrich track IDs (§13), request
\`part=status\` and **\*\*drop everything with \`status.embeddable === false\`\*\***. That
eliminates 101/150 before a listener ever hits it. Keep the runtime handler as a net
that should almost never fire.

**---**

**## 5. Progress is polled**

The YouTube iframe API has **\*\*no \`timeupdate\` event\*\***. You poll.

\`\`\`js
useEffect(() => {
  if (!ready) return
  const id = setInterval(() => {
    const p = playerRef.current
    if (!p) return
    setTime(p.getCurrentTime() ?? 0)
    setDuration(p.getDuration() ?? 0)      // returns 0 until metadata lands — re-read
  }, 250)
  return () => clearInterval(id)
}, [ready])
\`\`\`

250ms is the right trade: smooth to a human, 1/15th the cost of a rAF loop.

**\*\*Everything downstream keys off the floored second, never the float:\*\***

\`\`\`js
const whole = Math.floor(time)
useEffect(() => { save(slug, { id, time: whole }) }, [whole, slug, id])
useEffect(() => { publishPosition(whole, duration) }, [whole, duration])
\`\`\`

Depend on raw \`time\` and you write to \`localStorage\` four times a second, forever.

**---**

**## 6. Resume where you left off**

Per playlist, keyed by slug:

\`\`\`
localStorage["pujoprem\:playback\:v1\:agomoni"] = {"id":"…","time":137}
\`\`\`

**\*\*Reads must be SSR-safe\*\*** or every load logs a hydration mismatch:

\`\`\`js
const store = useMemo(() => {
  let cache
  return {
    subscribe: () => () => {},
    getSnapshot: () => (cache ??= readSaved(slug)),   // ⬅ MUST be referentially stable
    getServerSnapshot: () => null,
  }
}, [slug])

const saved = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
\`\`\`

React throws *\*"The result of getSnapshot should be cached"\** if that function returns a
fresh object each call. Hence \`??=\`.

**\*\*Restore is guarded and runs exactly once:\*\***

\`\`\`js
const didResume = useRef(false)

const resumeOnce = useCallback(() => {
  if (didResume.current) return
  didResume.current = true
  if (!saved) return
  if (saved.time <= 5) return                  // not worth restoring the first 5s
  if (saved.id !== currentId) return           // saved song isn't the loaded one
  playerRef.current?.seekTo(saved.time, true)  // true = seek now, don't wait for buffer
  setTime(saved.time)
}, [saved, currentId])
\`\`\`

Called from both PLAYING and CUED, because whichever lands first is the earliest the
player accepts a seek. The ref makes the second call a no-op.

The saved ID also chooses the **\*\*starting index\*\***:

\`\`\`js
const savedIndex = useMemo(
  () => (saved ? tracks.findIndex(t => t.id === saved.id) : -1),
  [saved, tracks],
)
const index = explicitIndex ?? (savedIndex < 0 ? 0 : savedIndex)
\`\`\`

**\*\*Three storage rules, all load-bearing:\*\***

1\. Every read through \`useSyncExternalStore\` with a matching \`getServerSnapshot\`.
2\. Every read *\*and\** write inside \`try {} catch {}\` — \*\*Safari private mode throws on
   \`setItem\`\*\*, and an uncaught throw takes the whole player down.
3\. Persist on the floored second (§5).

\> Resume matters far more here than on a normal playlist, because of Mahalaya. See §12.

**---**

**## 7. Autoplay policy, and the \`pending\` flag**

**\*\*The first play must come from a real user gesture. Always.\*\*** Attempting autoplay on
cold load fails silently under every browser's policy and is indistinguishable from a
bug.

But there is a 200–800ms window on a cold cache between the page being interactive and
\`YT.Player\` existing — and the listener **\*\*will\*\*** click inside it. Without handling
that, the first click does nothing and the site is broken on first impression.

\`\`\`js
const [pending, setPending] = useState(false)

const play = useCallback(() => {
  const p = playerRef.current
  if (p) p.playVideo()
  else setPending(true)            // remember the intent
}, [])

const pause = useCallback(() => {
  const p = playerRef.current
  if (p) p.pauseVideo()
  else setPending(false)
}, [])

const handleReady = useCallback((p) => {
  playerRef.current = p
  setDuration(p.getDuration() ?? 0)
  setReady(true)
  resumeOnce()
  if (pending) { setPending(false); p.playVideo() }   // ⬅ honour the early click
}, [pending, resumeOnce])
\`\`\`

**\*\*Boot order:\*\***

\`\`\`
1\. Track list is already in the HTML — no fetch, no spinner, no loading state.
2\. Hydrate. useSyncExternalStore reads shuffle / repeat / volume / saved position.
3\. rAF → apply shuffle AFTER first paint (§9).
4\. Mount the 1px div, inject iframe\_api, park onYouTubeIframeAPIReady.
5\. onReady → store ref, read duration, ready = true, resumeOnce(), honour \`pending\`.
6\. Playing → 250ms poll · keepAlive WAV loops · Media Session publishes · watchdog arms.
7\. ENDED → advance → loadVideoById → autoplay → ⟲
\`\`\`

**---**

**## 8. Volume, mute, and fades**

**### 8.1 Volume**

Persisted integer 0–100, validated on read (finite, in range, else default \`80\`):

\`\`\`js
const applyVolume = useCallback(() => {
  playerRef.current?.setVolume(muted ? 0 : Math.round(volume \* fade.current))
}, [muted, volume])

useEffect(() => { if (ready) applyVolume() }, [applyVolume, ready])
\`\`\`

\`fade.current\` is a ref in \`[0,1]\`, animated by §8.2. Keeping it in a ref rather than
state is deliberate — it moves at 60fps and must never trigger a render.

**### 8.2 Fading across the track boundary**

You have one iframe, so a true crossfade is impossible — you cannot have two songs
decoded at once. What you *\*can\** do is remove the hard cut, which is what actually
sounds jarring when Rabindra Sangeet hands over to a dhaak recording.

\`\`\`js
const FADE\_OUT\_S = 2.5
const FADE\_IN\_S  = 1.2

// fade out, driven by the same 250ms poll
useEffect(() => {
  if (!playing || !duration) return
  const remaining = duration - time
  if (remaining > FADE\_OUT\_S) { fade.current = 1; return }
  fade.current = Math.max(0, remaining / FADE\_OUT\_S)
  applyVolume()
}, [time, duration, playing, applyVolume])

// fade in, on PLAYING after a track change
const fadeIn = useCallback(() => {
  const t0 = performance.now()
  const step = (now) => {
    const k = Math.min(1, (now - t0) / (FADE\_IN\_S \* 1000))
    fade.current = k
    applyVolume()
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}, [applyVolume])
\`\`\`

**\*\*Reset \`fade.current = 1\` on every manual seek and on pause\*\***, or a listener who
scrubs into the last two seconds and back gets permanently quiet audio. This is the
bug this design most easily produces — guard it explicitly:

\`\`\`js
const seek = useCallback((s) => {
  fade.current = 1            // ⬅ always
  applyVolume()
  playerRef.current?.seekTo(Math.max(0, Math.min(s, duration || s)), true)
  setTime(s)
}, [duration, applyVolume])
\`\`\`

**\*\*Skip fading entirely when \`repeat === 'one'\`\*\*** — a track looping on itself should
loop seamlessly, not pulse quiet once a cycle.

**---**

**## 9. Lock screen and background audio**

Two independent mechanisms. **\*\*You need both.\*\*** Media Session alone gives you controls
that do nothing on iOS. The silent WAV alone gives you background audio with no
controls.

This is the single most important section for a Puja playlist, because the real usage
is *\*phone in pocket, screen locked, all day.\*

**### 9.1 Media Session — the OS controls**

Register once on mount. Wrap each individually — browsers throw on unsupported actions
and one throw aborts the rest of the loop:

\`\`\`js
useEffect(() => {
  if (!('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  const actions = [
    ['play',          () => cb.current.onPlay()],
    ['pause',         () => cb.current.onPause()],
    ['previoustrack', () => cb.current.onPrevious()],
    ['nexttrack',     () => cb.current.onNext()],
    ['seekbackward',  e => cb.current.onSeek(cb.current.currentTime - (e.seekOffset ?? 10))],
    ['seekforward',   e => cb.current.onSeek(cb.current.currentTime + (e.seekOffset ?? 10))],
    ['seekto',        e => e.seekTime != null && cb.current.onSeek(e.seekTime)],
  ]
  for (const [a, h] of actions) { try { ms.setActionHandler(a, h) } catch {} }
  return () => { for (const [a] of actions) { try { ms.setActionHandler(a, null) } catch {} } }
}, [])   // ⬅ EMPTY. read live values through the \`cb\` ref.
\`\`\`

**\*\*The \`cb\` ref is essential.\*\*** Re-registering handlers on every render makes iOS drop
the lock-screen session intermittently — a bug that looks random and is miserable to
chase.

Then publish three things separately:

\`\`\`js
// on track change
navigator.mediaSession.metadata = new MediaMetadata({
  title:  track.title,                                    // "Jago Tumi Jago"
  artist: track.singer || track.artist || playlistLabel,  // "Dwijen Mukhopadhyay"
  album:  playlistLabel,                                  // "Agomoni"
  artwork: [{ src: \`https\://i.ytimg.com/vi/${track.id}/hqdefault.jpg\`,
              sizes: '480x360', type: 'image/jpeg' }],
})

// on play/pause
navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'

// once per second — and it CAN throw
try {
  navigator.mediaSession.setPositionState({
    duration,
    position: Math.min(whole, duration),   // ⬅ clamp; throws if position > duration
    playbackRate: 1,
  })
} catch {}
\`\`\`

Artwork is free — YouTube's thumbnail CDN has an image for every video ID. Prefer
\`track.singer\` for the artist line: the YouTube channel name is usually a label
("Saregama Bengali"), and a listener wants to see *\*Hemanta Mukhopadhyay\**.

\`setPositionState\` throws when \`position > duration\`, which happens routinely at a
track boundary. Clamp **\*\*and\*\*** catch.

**### 9.2 The silent WAV — why background audio works at all**

A cross-origin YouTube iframe does not reliably bind the **\*\*page's\*\*** audio session. On
iOS that means an empty lock screen and playback dying when the phone locks.

Fix: synthesise silence in memory and loop it through a real, same-origin
\`HTMLAudioElement\` for as long as music plays. The page now owns a media element, so
the OS attributes the audio session to your page.

\`\`\`js
export function createKeepAlive() {
  const buf  = new ArrayBuffer(8044)          // 44-byte header + 8000 samples
  const view = new DataView(buf)
  const ascii = (off, s) => { for (let i = 0; i < s.length; i++) view\.setUint8(off + i, s.charCodeAt(i)) }

  ascii(0, 'RIFF');     view\.setUint32(4, 8036, true)   // filesize - 8
  ascii(8, 'WAVEfmt '); view\.setUint32(16, 16, true)    // fmt chunk length
  view\.setUint16(20, 1, true)      // PCM
  view\.setUint16(22, 1, true)      // mono
  view\.setUint32(24, 8000, true)   // 8 kHz
  view\.setUint32(28, 8000, true)   // byte rate
  view\.setUint16(32, 1, true)      // block align
  view\.setUint16(34, 8, true)      // bits per sample
  ascii(36, 'data');    view\.setUint32(40, 8000, true)

  // 128 == silence for UNSIGNED 8-bit PCM. 0 would be full-scale negative — a click.
  for (let i = 0; i < 8000; i++) view\.setUint8(44 + i, 128)

  const el = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })))
  el.loop = true
  return el
}
\`\`\`

\`\`\`js
const keepAlive = useRef(null)
useEffect(() => {
  if (!playing) return
  keepAlive.current ??= createKeepAlive()    // lazy: never built for a passive visitor
  keepAlive.current.play().catch(() => {})   // swallow autoplay rejection
}, [playing])
\`\`\`

8KB, one second of silence, looped. \`??=\` means a visitor who never presses play never
allocates it.

**\*\*This cannot be verified on desktop or in the iOS simulator.\*\*** Real iPhone, real lock
button, or it isn't tested.

**---**

**## 10. Stall detection and recovery**

Long unattended playback is the whole point of this site, and YouTube's player *\*does\**
get stuck — a buffering state that never resolves after a network handoff (wifi → 4G
while walking between pandals is the literal use case).

Nothing notifies you. You need a watchdog.

\`\`\`js
const stallTimer = useRef(0)
const lastProgress = useRef({ t: 0, at: 0 })

const armStall = useCallback(() => {
  clearTimeout(stallTimer.current)
  stallTimer.current = setTimeout(() => {
    const p = playerRef.current
    if (!p) return
    const now = p.getCurrentTime() ?? 0
    if (Math.abs(now - lastProgress.current.t) > 0.5) return   // it recovered on its own

    // genuinely stuck: nudge, then escalate
    p.seekTo(Math.max(0, now - 0.5), true)
    p.playVideo()

    escalate.current = setTimeout(() => {
      const after = p.getCurrentTime() ?? 0
      if (Math.abs(after - now) < 0.5) advance('stalled')      // give up, next track
    }, 8000)
  }, 15000)                                                     // 15s of no progress
}, [advance])
\`\`\`

Also drive it from the poll — a stall can happen without a BUFFERING event:

\`\`\`js
// inside the 250ms interval
const t = p.getCurrentTime() ?? 0
if (playing) {
  if (Math.abs(t - lastProgress.current.t) < 0.01) {
    if (Date.now() - lastProgress.current.at > 15000) armStall()
  } else {
    lastProgress.current = { t, at: Date.now() }
    clearTimeout(stallTimer.current)
  }
}
\`\`\`

**\*\*Escalation order matters:\*\*** nudge-seek first (recovers most stalls without the
listener noticing), and only skip the track if the nudge doesn't take. Skipping
immediately means one bad tunnel silently eats a song.

**\*\*Network events, too:\*\***

\`\`\`js
window\.addEventListener('offline', () => { wasPlaying.current = playing })
window\.addEventListener('online',  () => { if (wasPlaying.current) playerRef.current?.playVideo() })
\`\`\`

**---**

**## 11. One tab at a time**

Someone opens the site, forgets, opens it again — now two Mahalaya broadcasts are
playing three seconds apart. This is a genuinely common failure and trivially fixed:

\`\`\`js
const channel = useRef(null)

useEffect(() => {
  if (typeof BroadcastChannel === 'undefined') return
  const ch = new BroadcastChannel('pujoprem\:playback')
  channel.current = ch
  ch.onmessage = (e) => {
    if (e.data?.type === 'playing' && e.data.id !== tabId.current) {
      playerRef.current?.pauseVideo()          // another tab took over; yield
    }
  }
  return () => { ch.close(); channel.current = null }
}, [])

useEffect(() => {
  if (playing) channel.current?.postMessage({ type: 'playing', id: tabId.current })
}, [playing])
\`\`\`

The tab that most recently started playing wins; every other tab pauses itself. Guard
for \`BroadcastChannel\` being undefined (older Safari) — degrade to the current
free-for-all rather than crashing.

**---**

**## 12. Long-form tracks — the Mahalaya problem**

A Bengali Puja playlist has a shape no other playlist has: **\*\*Mahishasuramardini\*\***, the
Birendra Krishna Bhadra broadcast, runs about **\*\*1 hour 50 minutes\*\*** as a single video.
Chandi Path recordings are similar. Some playlists are 3-minute songs; some are one
two-hour track.

Consequences for the audio layer:

**\*\*Resume becomes the primary feature, not a nicety.\*\*** Nobody hears a two-hour broadcast
in one sitting. The §6 resume must be exact and must survive a phone reboot — it
already does, but raise its priority in your build order accordingly.

**\*\*Widen the seek granularity.\*\*** ±5s and ±10s steps are useless in a 110-minute
recording. Scale the step to the duration:

\`\`\`js
const seekStep = duration > 1800 ? 60 : duration > 600 ? 30 : 10
\`\`\`

**\*\*Add named positions for long tracks.\*\*** Purely data, no UI required — the audio layer
just needs to accept a seek target:

\`\`\`ts
type Track = {
  /\* … \*/
  chapters?: { at: number; label: string }[]   // seconds → 'Chandi Path', 'Jago Tumi Jago'
}
\`\`\`

**\*\*Skip end-of-track fading on long-form.\*\*** A 2.5s fade at the end of a 110-minute
broadcast is invisible; more importantly, applying the fade logic across a huge
duration is pointless work. Gate it:

\`\`\`js
const shouldFade = duration > 0 && duration < 900 && repeat !== 'one'
\`\`\`

**\*\*Mahalaya has a real-world scheduling hook.\*\*** It airs at 4am on Mahalaya day. If you
ever want the site to open on that track at that time, that's a data-layer decision
(pick the default playlist by date), not a player change — the player just receives a
different starting track list.

**\*\*The watchdog matters more here\*\*** A 110-minute unattended stream will hit at least
one network handoff. §10 is what keeps it alive.

**---**

**## 13. Track data**

The only thing a human maintains is a list of YouTube video IDs.

\`\`\`ts
export type Track = {
  id: string          // YouTube video ID — the sole curation input
  title: string       // cleaned, for display and lock screen
  rawTitle: string    // original YouTube title, kept for re-cleaning
  artist: string      // YouTube channel name (usually a label)
  singer?: string     // hand-annotated — Hemanta, Sandhya, Dwijen, Arati…
  chapters?: { at: number; label: string }[]   // §12
}

export type Playlist = {
  slug: string
  label: string
  trackIds: string[]  // ⬅ the file you actually edit
}
\`\`\`

An offline script turns IDs into \`Track\`s via the YouTube Data API
(\`videos.list?part=snippet,status,contentDetails\`) and commits the result as JSON:

\- \`rawTitle\` ← \`snippet.title\`, \`artist\` ← \`snippet.channelTitle\`
\- \`title\` ← strip \`(Full Song)\`, \`[Official Video]\`, \`| Bengali Devotional Song\`, and
  everything after the last \`|\`
\- **\*\*drop anything with \`status.embeddable === false\`\*\*** — the highest-value line in the
  whole pipeline (§4)
\- read \`contentDetails.duration\` and warn on anything over 30 minutes so you know which
  tracks need §12 treatment

Committing the JSON means zero YouTube calls at runtime and the track list ships inside
the HTML — first paint already knows every song, so \*\*there is no loading state anywhere
in the player.\*\*

**\*\*Playlists:\*\*** Agomoni · Mahalaya (Mahishasuramardini) · Dhaaker Taal · Shyama Sangeet ·
Rabindra Sangeet · 90s Bangla Adhunik · Bhoger Gaan · Bijoya.

YouTube playlist: https://www.youtube.com/watch?v=E2zfQEo7Q_M&list=PLPB-o9PZQHGs

Bengali titles need \`lang="bn"\` on the elements that carry them so screen readers and
font fallback behave — that's the one presentational note in this document, and only
because it affects what the lock screen renders.

**---**

**## 14. Shuffle**

Persisted, defaults **\*\*on\*\*** — except it should default **\*\*off\*\*** for single-track and
sequential playlists (Mahalaya, Chandi Path). Make it a property of the playlist:

\`\`\`ts
type Playlist = { /\* … \*/ shuffleByDefault?: boolean }
\`\`\`

Applying shuffle during render breaks hydration, so apply it in a \`requestAnimationFrame\`
after first paint — imperceptible to a human, invisible to React:

\`\`\`js
const [ordered, setOrdered] = useState(tracks)   // original order on both sides
const applied = useRef(false)

useEffect(() => {
  if (applied.current || !shuffled) return
  const raf = requestAnimationFrame(() => { applied.current = true; setOrdered(shuffle(tracks)) })
  return () => cancelAnimationFrame(raf)
}, [shuffled, tracks])
\`\`\`

**\*\*Toggling shuffle mid-song pins the current track to the front\*\*** so the music doesn't
jump:

\`\`\`js
const mixed = shuffle(tracks.filter(t => t.id !== currentId))
const current = tracks.find(t => t.id === currentId)
setOrdered(current ? [current, ...mixed] : mixed)
\`\`\`

**\*\*When the array identity changes, re-find the playing track and correct the index\*\*** —
reordering must never change what is currently sounding:

\`\`\`js
if (prevOrdered !== ordered) {
  const playingId = prevOrdered[index]?.id
  setPrevOrdered(ordered)
  const found = playingId ? ordered.findIndex(t => t.id === playingId) : -1
  if (found >= 0 && found !== index) setIndex(found)
}
\`\`\`

**---**

**## 15. Sleep timer**

Directly an audio-layer concern, and the right fit for a site people fall asleep to
during Pujo nights:

\`\`\`js
const sleepAt = useRef(null)

// inside the 250ms poll
if (sleepAt.current && Date.now() >= sleepAt.current) {
  sleepAt.current = null
  fadeToSilence(8000).then(() => { pause(); fade.current = 1; applyVolume() })
}
\`\`\`

Fade over \~8 seconds rather than cutting — reuse the §8.2 ramp with a longer duration.
A hard stop wakes people up, which defeats the feature.

Offer "end of current track" as an option too: set a flag and let §3's \`advance\` stop
instead of advancing.

**---**

**## 16. Module layout**

\`\`\`
src/audio/                    ⬅ no JSX in this folder. ever.
├─ useYouTubeHost.ts          §1      mount once, loadVideoById on change
├─ usePlayback.ts             §2–§7   the state machine
├─ usePersistedPlayback.ts    §6      resume, per-slug
├─ useVolume.ts               §8      volume × fade, mute
├─ useMediaSession.ts         §9.1
├─ keepAlive.ts               §9.2    silent WAV factory
├─ useWatchdog.ts             §10     stall detect + escalate
├─ useTabExclusivity.ts       §11     BroadcastChannel
├─ useShuffle.ts              §14
├─ useSleepTimer.ts           §15
└─ constants.ts
\`\`\`

**\*\*Two rules:\*\***

1\. Nothing in \`src/audio/\` imports a React component.
2\. Nothing outside \`useYouTubeHost.ts\` touches \`window\.YT\`.

Rule 2 is the ToS insurance. If the hidden player ever has to go, you rewrite \*\*one
file\*\* to drive an \`HTMLAudioElement\` against self-hosted audio — the state machine,
resume, Media Session, watchdog, tab exclusivity, shuffle, and sleep timer are all
untouched, because none of them know what is making the sound.

**### The surface the app consumes**

\`\`\`ts
type Playback = {
  track: Track | undefined
  index: number
  ready: boolean          // player exists
  playing: boolean
  pending: boolean        // clicked before the player existed
  currentTime: number
  duration: number

  play(): void; pause(): void; toggle(): void
  next(): void; previous(): void; select(i: number): void
  seek(s: number): void; seekBy(d: number): void

  volume: number; muted: boolean
  changeVolume(v: number): void; toggleMute(): void
  repeat: Repeat; setRepeat(r: Repeat): void
  shuffled: boolean; toggleShuffle(): void
  setSleepTimer(ms: number | null): void

  handleReady(p: YTPlayer): void       ┐
  handleStateChange(code: number): void├─ wired straight into useYouTubeHost
  handleError(code: number): void      ┘
}
\`\`\`

\`previous()\` is context-sensitive, as every music player is:

\`\`\`js
const previous = useCallback(() => {
  if (currentTime > 3) { seek(0); return }              // >3s in → restart this track
  select(index <= 0 ? tracks.length - 1 : index - 1)    // else actually go back
}, [currentTime, index, tracks.length, seek])
\`\`\`

**### Constants**

\`\`\`ts
export const PROGRESS\_POLL\_MS   = 250
export const RESUME\_MIN\_SECONDS = 5
export const REWIND\_THRESHOLD   = 3
export const AWAY\_GRACE\_MS      = 1\_800\_000   // 30 min
export const DEFAULT\_VOLUME     = 80
export const FADE\_OUT\_S         = 2.5
export const FADE\_IN\_S          = 1.2
export const STALL\_TIMEOUT\_MS   = 15\_000
export const STALL\_ESCALATE\_MS  = 8\_000
export const LONG\_FORM\_S        = 900         // above this, treat as long-form (§12)
\`\`\`

**---**

**## 17. Backgrounding**

\`\`\`js
const onVisibility = () => {
  if (document.visibilityState === 'hidden') {
    if (!playing) return
    const t = playerRef.current?.getCurrentTime()
    if (id && typeof t === 'number') save(slug, { id, time: Math.floor(t) })
    hiddenAt.current = Date.now()
    return
  }
  const since = hiddenAt.current
  hiddenAt.current = null
  if (since === null || Date.now() - since > AWAY\_GRACE\_MS) return
  playerRef.current?.playVideo()      // back within 30 min → resume
}
\`\`\`

**\*\*It deliberately does not pause on hide.\*\*** Music continuing while the phone locks or
the listener switches apps is the entire point. What this does is snapshot the position
on leaving and resume if the browser throttled or suspended the tab. Past 30 minutes,
you come back paused with your position intact.

**---**

**## 18. Build order**

\| | Ship | Why |
\| --- | --- | --- |
\| **\*\*1\*\*** | Hidden player + \`ENDED → next\` + play/pause | This is the product. \~150 lines and the music never stops. |
\| **\*\*2\*\*** | Resume · error-skip · visibility · volume/mute | Turns a demo into something you leave running all day. |
\| **\*\*3\*\*** | Media Session + keepAlive WAV | Phone-in-pocket, screen-locked playback. The actual use case. |
\| **\*\*4\*\*** | Watchdog · tab exclusivity · repeat modes | Survives unattended hours and real networks. |
\| **\*\*5\*\*** | Fades · shuffle · sleep timer · long-form handling | Polish. |

**---**

**## 19. Failure modes**

\| Symptom | Cause |
\| --- | --- |
\| First click does nothing | No \`pending\` flag (§7) |
\| iOS jumps to fullscreen video | Missing \`playsinline: 1\` (§1) |
\| Every control method no-ops | Missing \`enablejsapi: 1\` (§1) |
\| Two songs playing at once | Duplicate \`\<script>\` → second player (§1.1), or two tabs (§11) |
\| Play state strobes | BUFFERING (\`3\`) treated as paused (§2) |
\| CPU pegged, playlist frozen | Unbounded skip recursion — all tracks dead (§4) |
\| Songs silently skipped | \`status.embeddable === false\` not filtered at build (§4, §13) |
\| 1–3s gap when a track repeats | \`loadVideoById\` instead of \`seekTo(0)\` under \`repeat:'one'\` (§3) |
\| Audio permanently quiet | Fade ref not reset on seek/pause (§8.2) |
\| Hydration mismatch | Missing \`getServerSnapshot\`, or shuffle applied during render (§6, §14) |
\| "getSnapshot should be cached" | \`getSnapshot\` returns a new object each call (§6) |
\| Crash in Safari private mode | Unwrapped \`localStorage.setItem\` (§6) |
\| Lock screen empty / dies on lock | Missing keepAlive WAV (§9.2) |
\| Lock-screen buttons stop working | Media Session handlers re-registered every render (§9.1) |
\| \`setPositionState\` throws | \`position > duration\` at a track boundary — clamp (§9.1) |
\| Playback dies in a tunnel, never returns | No stall watchdog (§10) |
\| Seeking is useless in Mahalaya | Fixed ±10s step on a 110-minute track (§12) |

**---**

**## 20. Verification**

**\*\*Unit\*\*** — test \`usePlayback\` against a fake player (\`playVideo\`, \`pauseVideo\`,
\`seekTo\`, \`getCurrentTime\`, \`getDuration\`, \`loadVideoById\` as mocks):

\- ENDED advances; ENDED on the last track wraps under \`repeat:'all'\`, stops under
  \`'off'\`, and **\*\*seeks to 0 without reloading\*\*** under \`'one'\`
\- manual \`next()\` advances even under \`repeat:'one'\`
\- \`onError(150)\` blacklists and skips forward
\- every-track-dead **\*\*terminates\*\*** instead of spinning
\- \`previous()\` at 4s restarts; at 2s goes back one
\- BUFFERING does not change \`playing\`
\- \`play()\` before \`handleReady\` sets \`pending\`; \`handleReady\` then plays
\- a seek during the end-of-track fade resets the fade to 1

**\*\*\`keepAlive.ts\`\*\*** — byte-level: buffer is exactly 8044 bytes, \`RIFF\` at offset 0,
\`WAVE\` at 8, \`8000\` at offset 24, and all 8000 data bytes are \`128\`.

**\*\*Storage\*\*** — round-trip; corrupt JSON returns the default; \`setItem\` throwing does not
propagate.

**\*\*Manual, in this order — each has caught a real bug in this exact class of app:\*\***

1\. Click play the instant the page paints, before the iframe exists → it must still
   play. (Tests \`pending\`.)
2\. Let a track end untouched → the next one starts.
3\. Reload mid-song → resumes within a second of where you were.
4\. Open Mahalaya, seek to 1:30:00, close the tab, reopen → lands at 1:30:00.
5\. Switch apps for 2 min → still playing. For 45 min → paused, position kept.
6\. **\*\*On a real iPhone\*\***: play → lock the screen → audio continues, lock screen shows
   title/singer/thumbnail, and the lock-screen next button advances the track.
\*Simulator and desktop responsive mode do not test this.\*
7\. Open the site in a second tab and press play → the first tab pauses itself.
8\. Toggle airplane mode for 20 seconds mid-song → recovers without skipping the track.
9\. Put a known non-embeddable video ID in the list → skipped silently, no stall, no
   console spew.
10\. Set a 1-minute sleep timer → fades to silence over \~8s and pauses, doesn't cut.
11\. Safari private browsing → no crash.