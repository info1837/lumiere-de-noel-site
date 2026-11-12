"""Frame-to-frame jitter of a video, per shot.

usage: jitter.py video.mp4 [...]
Decodes at short side 540, estimates the global similarity transform between consecutive frames
(Shi-Tomasi corners + pyramidal LK + RANSAC), splits shots at cuts, and reports per shot:
  jit  = mean |frame-to-frame motion - its smoothed version| (px, scaled to a 1080-px short side)
         -> the handheld shake you see; the smooth camera move is not counted
  rot  = same for rotation, in 1/100 degree
  p95  = 95th percentile of the translational residual (px @1080)
Cuts: frames where tracking fails or the luma difference spikes against its neighbours.
"""
import subprocess, sys, json
import numpy as np, cv2


def frames(path, short=540):
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height", "-of", "json", path], capture_output=True, text=True).stdout)["streams"][0]
    w, h = s["width"], s["height"]
    k = short / min(w, h)
    W, H = int(round(w * k / 2) * 2), int(round(h * k / 2) * 2)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W), 1080 / short


def motion(a, b):
    pts = cv2.goodFeaturesToTrack(a, 400, 0.01, 12, blockSize=7)
    if pts is None or len(pts) < 20:
        return None
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(a, b, pts, None, winSize=(21, 21), maxLevel=3)
    ok = st.ravel() == 1
    if ok.sum() < 20:
        return None
    m, inl = cv2.estimateAffinePartial2D(pts[ok], nxt[ok], method=cv2.RANSAC, ransacReprojThreshold=2.0)
    if m is None or inl.sum() < 15:
        return None
    return m[0, 2], m[1, 2], np.degrees(np.arctan2(m[1, 0], m[0, 0]))


def smooth(x, sigma=4.0):
    r = int(3 * sigma)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    return np.convolve(np.pad(x, r, mode="edge"), k, mode="valid")


def analyse(path):
    fr, scale = frames(path)
    diffs = np.array([np.abs(fr[i].astype(np.int16) - fr[i - 1]).mean() for i in range(1, len(fr))])
    med = np.median(diffs)
    shots, cur = [], []
    for i in range(1, len(fr)):
        m = motion(fr[i - 1], fr[i])
        nb = np.concatenate([diffs[max(0, i - 7):i - 2], diffs[i:i + 5]])
        loc = np.median(nb) if len(nb) else med
        cut = m is None or diffs[i - 1] > max(3 * loc, loc + 10)
        if cut:
            if cur: shots.append((start, cur))
            cur, start = [], i
            continue
        if not cur: start = i - 1 if not shots and not cur else start
        cur.append(m)
    if cur: shots.append((start, cur))
    out = []
    for st, ms in shots:
        if len(ms) < 8:
            continue
        a = np.array(ms)
        res = np.stack([a[:, j] - smooth(a[:, j]) for j in range(3)], 1)
        t = np.hypot(res[:, 0], res[:, 1]) * scale
        out.append(dict(start=st, n=len(ms) + 1, jit=float(t.mean()), p95=float(np.percentile(t, 95)),
                        rot=float(np.abs(res[:, 2]).mean() * 100)))
    return out, len(fr)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        shots, n = analyse(p)
        tot = sum(s["n"] for s in shots)
        mean = sum(s["jit"] * s["n"] for s in shots) / max(tot, 1)
        worst = max(s["jit"] for s in shots) if shots else 0
        print(f"{p.split('/')[-1]:34s} frames={n:3d} shots={len(shots)}  JITTER mean={mean:5.2f}px worst-shot={worst:5.2f}px")
        for s in shots:
            print(f"   @{s['start']/23.976:5.2f}s n={s['n']:3d}  jit={s['jit']:5.2f}px p95={s['p95']:5.2f}px rot={s['rot']:4.1f}")
