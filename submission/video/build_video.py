import glob
import os
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

ROOT = r"C:\projects\portapulse\submission"
FRAMES = os.path.join(ROOT, "video-frames")
OUT = os.path.join(ROOT, "video")
AUDIO = os.path.join(OUT, "audio")
STAGE = os.path.join(OUT, "stage")
os.makedirs(STAGE, exist_ok=True)

W, H, FPS = 1920, 1080, 30
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

F_UI = r"C:\Windows\Fonts\segoeui.ttf"
F_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
F_SEMI = r"C:\Windows\Fonts\seguisb.ttf"
F_MONO = r"C:\Windows\Fonts\consola.ttf"

BG = (11, 14, 20)
ACCENT = (0, 229, 153)
INDIGO = (99, 102, 241)
TEXT = (226, 232, 240)
MUTED = (148, 163, 184)
CARD = (21, 26, 35)


def font(path, size):
    return ImageFont.truetype(path, size)


def ease(t):
    return t * t * (3 - 2 * t)


def load(name, size):
    return Image.open(os.path.join(FRAMES, name)).convert("RGB").resize(size, Image.LANCZOS)


def base_canvas():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(0, H, 4):
        shade = 1 - (y / H) * 0.35
        d.line([(0, y), (W, y)], fill=(int(BG[0] * shade), int(BG[1] * shade), int(BG[2] * shade)))
    d.ellipse([-320, -420, 760, 420], fill=(13, 20, 30))
    d.ellipse([W - 620, H - 380, W + 260, H + 320], fill=(14, 18, 32))
    return img


def brand(img, draw, small=False):
    size = 46 if not small else 34
    f = font(F_BOLD, size)
    draw.rounded_rectangle([92, 62, 92 + size + 12, 62 + size + 12], radius=14, fill=ACCENT)
    draw.text((92 + (size + 12) / 2, 62 + (size + 12) / 2), "P", font=font(F_BOLD, int(size * 0.8)),
              fill=(11, 14, 20), anchor="mm")
    draw.text((92 + size + 30, 62 + size * 0.06), "PortaPulse", font=f, fill=(255, 255, 255))
    draw.text((92 + size + 30, 62 + size * 0.72), "Node Operations & Telemetry Suite for Portaldot",
              font=font(F_UI, 24), fill=MUTED)


def caption(draw, text, sub=None, y=938):
    f = font(F_SEMI, 40)
    w = draw.textlength(text, font=f)
    draw.rounded_rectangle([96, y - 18, 96 + w + 64, y + 58], radius=18, fill=CARD,
                           outline=(45, 55, 72), width=2)
    draw.rectangle([96, y - 18, 104, y + 58], fill=ACCENT)
    draw.text((132, y + 20), text, font=f, fill=TEXT, anchor="lm")
    if sub:
        draw.text((96, y + 74), sub, font=font(F_UI, 26), fill=MUTED)


def glass(img, draw, box, radius=22, fill=(17, 22, 31, 235), outline=(48, 58, 76)):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=2)
    img.paste(layer, (0, 0), layer)
    draw = ImageDraw.Draw(img)
    return draw


def add_glow(img, draw, box, color, width=4, radius=22):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, outline=color + (255,), width=width)
    img.paste(layer, (0, 0), layer)


def stat_chips(draw, chips, x0=96, y0=196, w=372, h=104, gap=18):
    for i, (label, value) in enumerate(chips):
        x = x0 + i * (w + gap)
        draw.rounded_rectangle([x, y0, x + w, y0 + h], radius=18, fill=CARD, outline=(44, 54, 71), width=2)
        draw.rectangle([x, y0 + 22, x + 5, y0 + h - 22], fill=ACCENT)
        draw.text((x + 28, y0 + 26), label, font=font(F_UI, 22), fill=MUTED)
        draw.text((x + 28, y0 + 62), value, font=font(F_BOLD, 40), fill=(255, 255, 255))


def build_stage1(out_path):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    brand(img, d)
    d = glass(img, d, [96, 180, W - 96, 660], radius=24)
    hero = load("p-hero.png", (W - 96 - 96 - 24, 660 - 180 - 24))
    img.paste(hero, (108, 192))
    stat_chips(d, [("LATEST BLOCK", "#148,296"), ("AVG BLOCK TIME", "3.2s"),
                   ("LIVE TPS", "16.8"), ("ACTIVE PEERS", "34")], y0=700)
    caption(d, "Live dashboard on the Portaldot testnet", "React 19 - Vite - Tailwind CSS - @polkadot/api")
    img.save(out_path)


def build_stage2(out_path):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    brand(img, d, small=True)
    d.text((96, 190), "Real-time telemetry", font=font(F_BOLD, 44), fill=(255, 255, 255))
    frames = [load(f"p-live-{i}.png", (1160, 725)) for i in range(3)]
    box = [96, 258, 96 + 1160, 258 + 725]
    d = glass(img, d, [box[0] - 12, box[1] - 12, box[2] + 12, box[3] + 12], radius=24)
    img.paste(frames[0], (box[0], box[1]))
    chips = [("Block", "148,296", 0), ("Block time", "3.2s", 1), ("TPS", "16.8", 2), ("Peers", "34", 3)]
    cx = 1330
    for label, value, _ in chips:
        y = 300 + _ * 172
        d.rounded_rectangle([cx, y, cx + 494, y + 148], radius=18, fill=CARD, outline=(44, 54, 71), width=2)
        d.text((cx + 28, y + 26), label.upper(), font=font(F_UI, 22), fill=MUTED)
        d.text((cx + 28, y + 66), value, font=font(F_BOLD, 52), fill=ACCENT)
    caption(d, "Block height, throughput and peers update live", "Substrate + EVM telemetry")
    img.save(out_path)
    return frames, box, chips


def build_stage3(out_path):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    brand(img, d, small=True)
    d.text((96, 190), "RPC latency benchmark", font=font(F_BOLD, 44), fill=(255, 255, 255))
    shot = load("p-bench.png", (1560, 975))
    crop = shot.crop((0, 250, 1560, 800))
    box = [96, 262, 96 + 1560, 262 + 550]
    d = glass(img, d, [box[0] - 12, box[1] - 12, box[2] + 12, box[3] + 12], radius=24)
    img.paste(crop, (box[0], box[1]))
    add_glow(img, d, [box[0] - 12, box[1] - 12, box[0] + 730, box[3] + 12], INDIGO, width=4, radius=24)
    caption(d, "Health checks across public and local endpoints", "Low-latency scoring for validators")
    img.save(out_path)


def build_stage4(out_path):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    brand(img, d, small=True)
    d.text((96, 190), "Gas and stress simulator", font=font(F_BOLD, 44), fill=(255, 255, 255))
    shot = load("p-stress.png", (1560, 975))
    crop = shot.crop((0, 250, 1560, 800))
    box = [96, 262, 96 + 1560, 262 + 550]
    d = glass(img, d, [box[0] - 12, box[1] - 12, box[2] + 12, box[3] + 12], radius=24)
    img.paste(crop, (box[0], box[1]))
    d.rounded_rectangle([1130, 300, 1620, 470], radius=18, fill=(11, 14, 20), outline=ACCENT, width=3)
    d.text((1160, 326), "Batch ID  tx_batch_8lnd2", font=font(F_MONO, 26), fill=TEXT)
    d.text((1160, 372), "Gas Burned  0.1050 POT", font=font(F_MONO, 26), fill=ACCENT)
    d.text((1160, 418), "Avg Finality  3.04s", font=font(F_MONO, 26), fill=TEXT)
    caption(d, "Batch transaction load with real fee estimation", "50-transaction stress test")
    img.save(out_path)


def build_stage5(out_path):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    brand(img, d, small=True)
    d.text((96, 190), "Validator heartbeat alerts", font=font(F_BOLD, 44), fill=(255, 255, 255))
    shot = load("p-alerts.png", (1560, 975))
    crop = shot.crop((0, 480, 1560, 900))
    box = [96, 262, 96 + 1560, 262 + 420]
    d = glass(img, d, [box[0] - 12, box[1] - 12, box[2] + 12, box[3] + 12], radius=24)
    img.paste(crop, (box[0], box[1]))
    d.rounded_rectangle([620, 700, 1300, 776], radius=16, fill=CARD, outline=ACCENT, width=2)
    d.text((960, 738), "Webhook endpoint saved for heartbeat triggers.", font=font(F_MONO, 30),
           fill=ACCENT, anchor="mm")
    caption(d, "Downtime alerts before slashing happens", "Discord and Telegram webhooks")
    img.save(out_path)


def build_stage6(out_path):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    for i in range(6):
        d.line([(0, 120 + i * 160), (W, 60 + i * 160)], fill=(15, 20, 30), width=2)
    brand(img, d)
    f = font(F_BOLD, 76)
    title = "Open source. Built for Portaldot."
    d.text((W / 2, 430), title, font=f, fill=(255, 255, 255), anchor="mm")
    d.text((W / 2, 530), "Portaldot Hacker House 2026  -  Track 3: Node Operations & Tooling",
           font=font(F_SEMI, 34), fill=ACCENT, anchor="mm")
    d.rounded_rectangle([W / 2 - 560, 640, W / 2 + 560, 744], radius=20, fill=CARD, outline=(48, 58, 76), width=2)
    d.text((W / 2, 692), "github.com/naomi197/portapulse", font=font(F_MONO, 36), fill=TEXT, anchor="mm")
    caption(d, "PortaPulse - high-performance node tooling", "MIT licensed - live demo on GitHub Pages")
    img.save(out_path)


def frames_for(png, seconds, motion=None):
    img = Image.open(png).convert("RGB")
    total = int(seconds * FPS)
    for i in range(total):
        if motion == "zoom":
            t = ease(i / max(total - 1, 1))
            z = 1.0 + 0.035 * t
            nw, nh = int(W * z), int(H * z)
            big = img.resize((nw, nh), Image.LANCZOS)
            left = int((nw - W) * 0.5)
            top = int((nh - H) * 0.5)
            yield big.crop((left, top, left + W, top + H))
        elif motion == "pan":
            t = ease(i / max(total - 1, 1))
            nw, nh = int(W * 1.06), int(H * 1.06)
            big = img.resize((nw, nh), Image.LANCZOS)
            left = int((nw - W) * (0.15 + 0.5 * t))
            top = int((nh - H) * 0.5)
            yield big.crop((left, top, left + W, top + H))
        else:
            yield img


def write_clip(png, seconds, out_name, motion=None):
    path = os.path.join(STAGE, out_name)
    proc = subprocess.Popen(
        [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p", path],
        stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for frame in frames_for(png, seconds, motion):
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    proc.wait()
    return path


def main():
    s1 = os.path.join(STAGE, "s1.png")
    s2 = os.path.join(STAGE, "s2.png")
    s3 = os.path.join(STAGE, "s3.png")
    s4 = os.path.join(STAGE, "s4.png")
    s5 = os.path.join(STAGE, "s5.png")
    s6 = os.path.join(STAGE, "s6.png")

    build_stage1(s1)
    build_stage2(s2)
    build_stage3(s3)
    build_stage4(s4)
    build_stage5(s5)
    build_stage6(s6)
    print("stages rendered")

    clips = [
        write_clip(s1, 8.6, "c1.mp4", "zoom"),
        write_clip(s2, 9.0, "c2.mp4", "pan"),
        write_clip(s3, 10.2, "c3.mp4", "zoom"),
        write_clip(s4, 8.3, "c4.mp4", "zoom"),
        write_clip(s5, 9.9, "c5.mp4", "pan"),
        write_clip(s6, 8.2, "c6.mp4", "zoom"),
    ]
    print("clips written")

    with open(os.path.join(STAGE, "concat.txt"), "w", encoding="utf-8") as fh:
        for c in clips:
            fh.write("file '%s'\n" % c.replace("\\", "/"))

    silent = os.path.join(STAGE, "silent.mp4")
    subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(STAGE, "concat.txt"),
                    "-c", "copy", silent], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    narr = sorted(glob.glob(os.path.join(AUDIO, "line-*.wav")))
    silence = os.path.join(STAGE, "silence.wav")
    subprocess.run([FFMPEG, "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
                    "-t", "0.6", silence], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    inputs = []
    filter_parts = []
    for i, wav in enumerate(narr):
        inputs += ["-i", wav]
        filter_parts.append("[%d:a]aresample=22050,aformat=sample_fmts=s16:channel_layouts=mono[voice%d];" % (i, i))
    inputs += ["-i", silence]
    filter_parts.append("[%d:a]aresample=22050,aformat=sample_fmts=s16:channel_layouts=mono[voice%d];" % (len(narr), len(narr)))
    chain = "".join(filter_parts)
    chain += "".join("[voice%d]" % i for i in range(len(narr) + 1))
    chain += "concat=n=%d:v=0:a=1[voice]" % (len(narr) + 1)

    voice = os.path.join(STAGE, "voice.wav")
    subprocess.run([FFMPEG, "-y"] + inputs + ["-filter_complex", chain, "-map", "[voice]", voice],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    final = os.path.join(ROOT, "portapulse-demo.mp4")
    subprocess.run([FFMPEG, "-y", "-i", silent, "-i", voice,
                    "-filter_complex", "[1:a]apad=pad_dur=1.2,volume=1.9,highpass=f=90,acompressor=threshold=-18dB:ratio=3[a]",
                    "-map", "0:v", "-map", "[a]",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", final],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    dur = subprocess.run([FFMPEG, "-i", final], capture_output=True, text=True).stderr
    for line in dur.splitlines():
        if "Duration" in line:
            print(line.strip())
    print("FINAL:", final, os.path.getsize(final), "bytes")


if __name__ == "__main__":
    main()
