"""
=============================================================================
NASA Space Apps Challenge 2026 — Showcase Video Builder
Project: Field Shift (Smart Farm Intelligence)
Team: ASL_SPECTRA
Video Title: "Cooking Something for NASA Space Apps Challenge"
Final Output: Cooking_For_NASA_Space_Apps_Final_30s.mp4 (1360x768 @ 30fps, 30.0s)
=============================================================================
"""

import os
import sys
import math
import shutil
import subprocess
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# 0. CONFIGURATION & CONSTANTS
# ---------------------------------------------------------------------------
WIDTH = 1360
HEIGHT = 768
FPS = 30
TOTAL_DURATION = 30.0  # Exactly 30 seconds
TOTAL_FRAMES = int(TOTAL_DURATION * FPS)  # 900 frames

PREVIEW_VIDEO = "Field_Shift_Upgraded_Website_Preview.mp4"
OUTPUT_VIDEO = "Cooking_For_NASA_Space_Apps_Final_30s.mp4"

VOICEOVER_TEXT = (
    "We've been cooking something special for the NASA Space Apps Challenge. "
    "Meet Field Shift, built by team ASL_SPECTRA. "
    "Farmers like Sheikh Siraj face unpredictable rainfall, heat waves, and shifting soil moisture. "
    "What should they grow next? "
    "Field Shift connects live NASA SMAP, MODIS, and ECOSTRESS satellite data into a Four-Zone Radar and a 3D Field Digital Twin. "
    "With our Climate Scenario Simulator, Crop Rotation Planner, and bilingual Farmer Buddy AI, farmers choose high-yield crops with confidence. "
    "ASL_SPECTRA — adapting farms with NASA data."
)

# Find FFmpeg binary
try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_EXE = "ffmpeg"

print(f"[Init] Using FFmpeg: {FFMPEG_EXE}")

# ---------------------------------------------------------------------------
# 1. GENERATE NEURAL AI VOICEOVER (edge-tts)
# ---------------------------------------------------------------------------
def generate_voiceover():
    print("\n--- [Step 1/5] Synthesizing Neural AI Voiceover (edge-tts) ---")
    script_file = "voiceover_script.txt"
    with open(script_file, "w", encoding="utf-8") as f:
        f.write(VOICEOVER_TEXT)

    # en-US-ChristopherNeural with +42% rate fits the 30-second timeline (29.2s speech)
    cmd = [
        "edge-tts",
        "--voice", "en-US-ChristopherNeural",
        "--rate=+42%",
        "-f", script_file,
        "--write-media", "voiceover.mp3",
        "--write-subtitles", "voiceover.vtt"
    ]
    print("Running edge-tts command...")
    subprocess.run(cmd, check=True)
    print("Voiceover synthesized: voiceover.mp3 and voiceover.vtt")

# ---------------------------------------------------------------------------
# 2. GENERATE AMBIENT SCI-FI BACKGROUND AUDIO (48kHz Stereo @ -20dB)
# ---------------------------------------------------------------------------
def generate_ambient_audio():
    print("\n--- [Step 2/5] Synthesizing Sci-Fi Ambient Drone / Pad (-20dB) ---")
    sample_rate = 48000
    duration = TOTAL_DURATION
    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)

    # Warm cinematic space chord: Eb2, Bb2, Eb3, G3, Bb3, D4
    freqs = [77.78, 116.54, 155.56, 196.00, 233.08, 293.66]
    weights = [0.35, 0.25, 0.20, 0.12, 0.08, 0.05]

    # Slow gentle breathing LFOs
    lfo1 = 0.70 + 0.30 * np.sin(2 * np.pi * 0.12 * t)
    lfo2 = 0.70 + 0.30 * np.cos(2 * np.pi * 0.18 * t)

    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)

    for f, w in zip(freqs, weights):
        left += w * np.sin(2 * np.pi * f * t) * lfo1
        right += w * np.sin(2 * np.pi * (f * 1.002) * t + 0.5) * lfo2

    # Subtle space shimmer
    shimmer = 0.035 * np.sin(2 * np.pi * 622.25 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t))
    left += shimmer
    right += shimmer

    # Fade in / Fade out envelope (1.5s in, 2.0s out)
    fade_in = int(1.5 * sample_rate)
    fade_out = int(2.0 * sample_rate)
    env = np.ones(total_samples, dtype=np.float32)
    env[:fade_in] = np.linspace(0, 1, fade_in)
    env[-fade_out:] = np.linspace(1, 0, fade_out)

    left *= env
    right *= env

    # Normalize to -20 dBFS peak (0.09)
    max_peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if max_peak > 0:
        target_peak = 0.088
        left = (left / max_peak) * target_peak
        right = (right / max_peak) * target_peak

    left_pcm = (left * 32767).astype(np.int16)
    right_pcm = (right * 32767).astype(np.int16)
    interleaved = np.empty((total_samples * 2,), dtype=np.int16)
    interleaved[0::2] = left_pcm
    interleaved[1::2] = right_pcm

    with wave.open("ambient_drone.wav", "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(interleaved.tobytes())

    print("Ambient audio track created: ambient_drone.wav (30.0s stereo)")

# ---------------------------------------------------------------------------
# 3. RENDER INTRO HOOK CARD (00:00 - 00:02.5) & OUTRO BRAND CARD (00:27.5 - 00:30.0)
# ---------------------------------------------------------------------------
try:
    font_fs = ImageFont.truetype("arialbd.ttf", 36)
    font_tag = ImageFont.truetype("arialbd.ttf", 15)
    font_title = ImageFont.truetype("arialbd.ttf", 38)
    font_sub = ImageFont.truetype("arial.ttf", 22)
    font_hud = ImageFont.truetype("courbd.ttf", 14)
    font_outro_title = ImageFont.truetype("arialbd.ttf", 52)
    font_outro_tag = ImageFont.truetype("arialbd.ttf", 26)
    font_outro_sub = ImageFont.truetype("arial.ttf", 22)
    font_outro_badge = ImageFont.truetype("arialbd.ttf", 15)
except Exception:
    font_fs = font_tag = font_title = font_sub = font_hud = ImageFont.load_default()
    font_outro_title = font_outro_tag = font_outro_sub = font_outro_badge = font_fs

def render_intro_frame(f_idx):
    t_sec = f_idx / FPS
    img = Image.new("RGB", (WIDTH, HEIGHT), (3, 16, 8))
    draw = ImageDraw.Draw(img, "RGBA")
    cx, cy = WIDTH // 2, HEIGHT // 2 - 25

    # Radial ambient emerald aura
    for r in range(480, 0, -20):
        alpha = int(45 * (1 - r / 480))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 75, 40, alpha))

    # Concentric range rings
    for r in [100, 200, 320, 440]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(67, 239, 140, 40), width=1)

    # Crosshair axes
    draw.line([cx - 520, cy, cx + 520, cy], fill=(67, 239, 140, 25), width=1)
    draw.line([cx, cy - 340, cx, cy + 340], fill=(67, 239, 140, 25), width=1)

    # Rotating radar sweep line with fading wedge
    sweep_angle = (t_sec * 1.6 * math.pi) % (2 * math.pi)
    for trail in range(15):
        ta = sweep_angle - trail * 0.03
        t_alpha = max(0, int(160 * (1 - trail / 15)))
        tx = cx + int(440 * math.cos(ta))
        ty = cy + int(440 * math.sin(ta))
        draw.line([cx, cy, tx, ty], fill=(74, 222, 128, t_alpha), width=2 if trail == 0 else 1)

    # Logo Badge (38px scaled for intro -> 76x76)
    bw, bh = 76, 76
    bx0, by0 = cx - bw // 2, cy - 140
    bx1, by1 = bx0 + bw, by0 + bh

    aura_r = int(8 * math.sin(t_sec * 4 * math.pi))
    draw.rounded_rectangle([bx0 - 6 - aura_r, by0 - 6 - aura_r, bx1 + 6 + aura_r, by1 + 6 + aura_r],
                           radius=22, fill=(67, 239, 140, 30))
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=18, fill=(74, 222, 128, 255), outline=(187, 247, 208, 255), width=2)

    # Satellite pulse dot on badge corner
    dot_pulse = 0.5 + 0.5 * math.sin(t_sec * 6 * math.pi)
    dot_x, dot_y = bx1 - 11, by0 + 11
    draw.ellipse([dot_x - 5, dot_y - 5, dot_x + 5, dot_y + 5], fill=(255, 255, 255, 255))
    draw.ellipse([dot_x - 8 - int(dot_pulse * 4), dot_y - 8 - int(dot_pulse * 4),
                  dot_x + 8 + int(dot_pulse * 4), dot_y + 8 + int(dot_pulse * 4)],
                 outline=(74, 222, 128, int(200 * (1 - dot_pulse * 0.6))), width=1)

    draw.text((cx, by0 + 38), "FS", font=font_fs, fill=(4, 22, 11, 255), anchor="mm")

    # NASA Space Apps Tag
    draw.text((cx, by0 - 36), "GLOBAL HACKATHON • NASA SPACE APPS CHALLENGE 2026", font=font_tag, fill=(74, 222, 128, 240), anchor="mm")

    # Main Headline
    title_text = "COOKING SOMETHING FOR NASA SPACE APPS CHALLENGE"
    draw.text((cx, cy + 28), title_text, font=font_title, fill=(34, 197, 94, 160), anchor="mm")
    draw.text((cx, cy + 26), title_text, font=font_title, fill=(255, 255, 255, 255), anchor="mm")

    # Subtitle
    draw.text((cx, cy + 86), "Team ASL_SPECTRA • Smart Farm Intelligence", font=font_sub, fill=(163, 230, 53, 240), anchor="mm")

    # Bottom HUD Pill
    hud_text = "EARTH OBSERVATION SYNC: SMAP • MODIS • ECOSTRESS | MYMENSINGH FIELD 02"
    draw.rounded_rectangle([cx - 370, HEIGHT - 76, cx + 370, HEIGHT - 36], radius=20,
                           fill=(6, 26, 14, 230), outline=(67, 239, 140, 110), width=1)
    draw.text((cx, HEIGHT - 56), hud_text, font=font_hud, fill=(74, 222, 128, 240), anchor="mm")

    return img

def render_outro_frame(f_idx):
    t_sec = f_idx / FPS
    img = Image.new("RGB", (WIDTH, HEIGHT), (3, 14, 7))
    draw = ImageDraw.Draw(img, "RGBA")
    cx, cy = WIDTH // 2, HEIGHT // 2 - 20

    for r in range(480, 0, -25):
        alpha = int(40 * (1 - r / 480))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 75, 40, alpha))

    # Orbital arcs
    draw.arc([cx - 420, cy - 220, cx + 420, cy + 220], start=0, end=360, fill=(67, 239, 140, 30), width=1)
    draw.arc([cx - 360, cy - 180, cx + 360, cy + 180], start=-30, end=150, fill=(74, 222, 128, 50), width=2)

    # Logo Badge
    bw, bh = 84, 84
    bx0, by0 = cx - bw // 2, cy - 170
    bx1, by1 = bx0 + bw, by0 + bh

    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=20, fill=(74, 222, 128, 255), outline=(187, 247, 208, 255), width=2)
    dot_x, dot_y = bx1 - 12, by0 + 12
    draw.ellipse([dot_x - 5, dot_y - 5, dot_x + 5, dot_y + 5], fill=(255, 255, 255, 255))
    draw.ellipse([dot_x - 9, dot_y - 9, dot_x + 9, dot_y + 9], outline=(74, 222, 128, 200), width=1)
    draw.text((cx, by0 + 42), "FS", font=font_outro_title, fill=(4, 22, 11, 255), anchor="mm")

    # Title: FIELD SHIFT
    draw.text((cx, cy - 20), "FIELD SHIFT", font=font_outro_title, fill=(255, 255, 255, 255), anchor="mm")
    
    # Tagline
    draw.text((cx, cy + 32), "Adapting Farms with NASA Earth Observation Data", font=font_outro_tag, fill=(74, 222, 128, 255), anchor="mm")

    # Team Credits
    draw.text((cx, cy + 78), "Built with pride by Team ASL_SPECTRA • NASA Space Apps Challenge", font=font_outro_sub, fill=(240, 253, 244, 220), anchor="mm")

    # Data Badges Row
    badges = ["NASA SMAP", "MODIS NDVI", "ECOSTRESS", "MERRA-2", "GPM"]
    total_badge_w = len(badges) * 136 + (len(badges) - 1) * 12
    start_bx = cx - total_badge_w // 2

    for i, b_text in enumerate(badges):
        cur_x = start_bx + i * (136 + 12)
        draw.rounded_rectangle([cur_x, cy + 118, cur_x + 136, cy + 152], radius=16,
                               fill=(8, 36, 18, 220), outline=(67, 239, 140, 90), width=1)
        draw.text((cur_x + 68, cy + 135), b_text, font=font_outro_badge, fill=(163, 230, 53, 240), anchor="mm")

    # Bottom Mission Note
    draw.text((cx, cy + 180), "Empowering Farmers with Satellite Intelligence & Predictive AI", font=font_tag, fill=(148, 169, 159, 210), anchor="mm")

    return img

def render_cards():
    print("\n--- [Step 3/5] Rendering Animated Intro & Outro Cards ---")
    os.makedirs("temp_intro", exist_ok=True)
    os.makedirs("temp_outro", exist_ok=True)

    intro_frames = int(3.0 * FPS)
    outro_frames = int(3.0 * FPS)

    print("Rendering 90 Intro Frames...")
    for i in range(intro_frames):
        f = render_intro_frame(i)
        f.save(f"temp_intro/frame_{i:03d}.png")

    print("Rendering 90 Outro Frames...")
    for i in range(outro_frames):
        f = render_outro_frame(i)
        f.save(f"temp_outro/frame_{i:03d}.png")

    # Compile into video clips
    print("Compiling intro.mp4...")
    subprocess.run([
        FFMPEG_EXE, "-y", "-r", str(FPS), "-i", "temp_intro/frame_%03d.png",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "intro.mp4"
    ], check=True)

    print("Compiling outro.mp4...")
    subprocess.run([
        FFMPEG_EXE, "-y", "-r", str(FPS), "-i", "temp_outro/frame_%03d.png",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "outro.mp4"
    ], check=True)

# ---------------------------------------------------------------------------
# 4. CROSSFADE VIDEO CONCATENATION (Exactly 30.0s)
# ---------------------------------------------------------------------------
def assemble_video_crossfades():
    print("\n--- [Step 4/5] Assembling 30.0s Video with Smooth 0.5s Crossfades ---")
    # intro.mp4 (3.0s) + preview.mp4 (25.0s) + outro.mp4 (3.0s)
    # xfade 1: offset=2.5, duration=0.5 -> length = 2.5 + 25.0 = 27.5s
    # xfade 2: offset=27.0, duration=0.5 -> length = 27.0 + 3.0 = 30.0s!
    cmd = [
        FFMPEG_EXE, "-y",
        "-i", "intro.mp4",
        "-i", PREVIEW_VIDEO,
        "-i", "outro.mp4",
        "-filter_complex",
        "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=2.5[v01];"
        "[v01][2:v]xfade=transition=fade:duration=0.5:offset=27.0[v]",
        "-map", "[v]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "video_30s_no_audio.mp4"
    ]
    subprocess.run(cmd, check=True)
    print("Video timeline assembled: video_30s_no_audio.mp4 (Exactly 30.00s)")

# ---------------------------------------------------------------------------
# 5. GENERATE SUBTITLES, AUDIO MIX & FINAL EXPORT
# ---------------------------------------------------------------------------
def export_final_video():
    print("\n--- [Step 5/5] Burning-in Glassmorphic Captions & Mixing Stereo Audio ---")
    
    # Modern Glassmorphic Subtitles (ASS) with emerald highlights
    ass_content = """[Script Info]
ScriptType: v4.00+
PlayResX: 1360
PlayResY: 768

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: GlassCaption,Segoe UI,25,&H00FFFFFF,&H0043EF8C,&H00092816,&HC8031109,1,0,0,0,100,100,0.5,0,3,10,0,2,40,40,42,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.45,0:00:03.55,GlassCaption,,0,0,0,,We've been cooking something special for the {\\c&H43EF8C&}NASA Space Apps Challenge{\\c&HFFFFFF&}.
Dialogue: 0,0:00:03.55,0:00:06.71,GlassCaption,,0,0,0,,Meet {\\c&H43EF8C&}Field Shift{\\c&HFFFFFF&}, built by team {\\c&H86EFAC&}ASL_SPECTRA{\\c&HFFFFFF&}.
Dialogue: 0,0:00:06.71,0:00:11.50,GlassCaption,,0,0,0,,Farmers like Sheikh Siraj face unpredictable rainfall, heat waves, and shifting soil moisture.
Dialogue: 0,0:00:11.50,0:00:13.03,GlassCaption,,0,0,0,,What should they grow next?
Dialogue: 0,0:00:13.03,0:00:16.50,GlassCaption,,0,0,0,,{\\c&H43EF8C&}Field Shift{\\c&HFFFFFF&} connects live {\\c&H46DFFF&}NASA SMAP, MODIS, and ECOSTRESS{\\c&HFFFFFF&} satellite data...
Dialogue: 0,0:00:16.50,0:00:19.77,GlassCaption,,0,0,0,,...into a {\\c&H43EF8C&}Four-Zone Radar{\\c&HFFFFFF&} and a {\\c&H46DFFF&}3D Field Digital Twin{\\c&HFFFFFF&}.
Dialogue: 0,0:00:19.77,0:00:23.30,GlassCaption,,0,0,0,,With our {\\c&H43EF8C&}Climate Scenario Simulator, Crop Rotation Planner{\\c&HFFFFFF&}, and bilingual {\\c&H86EFAC&}Farmer Buddy AI{\\c&HFFFFFF&}...
Dialogue: 0,0:00:23.30,0:00:26.39,GlassCaption,,0,0,0,,...farmers choose high-yield crops with confidence.
Dialogue: 0,0:00:26.39,0:00:29.66,GlassCaption,,0,0,0,,{\\c&H86EFAC&}ASL_SPECTRA{\\c&HFFFFFF&} — adapting farms with {\\c&H46DFFF&}NASA data{\\c&HFFFFFF&}.
"""
    with open("captions.ass", "w", encoding="utf-8") as f:
        f.write(ass_content)

    final_cmd = [
        FFMPEG_EXE, "-y",
        "-i", "video_30s_no_audio.mp4",
        "-i", "voiceover.mp3",
        "-i", "ambient_drone.wav",
        "-filter_complex",
        "[0:v]subtitles=captions.ass[vout];"
        "[1:a]adelay=350|350,volume=1.10,aformat=channel_layouts=stereo[vo];"
        "[2:a]volume=0.32,aformat=channel_layouts=stereo[bgm];"
        "[vo][bgm]amix=inputs=2:duration=longest:normalize=0,aformat=channel_layouts=stereo[aout]",
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-pix_fmt", "yuv420p",
        "-t", "30.0",
        OUTPUT_VIDEO
    ]
    print("Muxing final video and audio with libx264 and aac...")
    subprocess.run(final_cmd, check=True)
    print(f"\n=============================================================================")
    print(f"SUCCESS: Final Showcase Video Exported -> {OUTPUT_VIDEO}")
    print(f"=============================================================================")

# ---------------------------------------------------------------------------
# 6. VERIFICATION & CLEANUP
# ---------------------------------------------------------------------------
def verify_output():
    print("\n--- Verification of Final Deliverable ---")
    p = subprocess.run([FFMPEG_EXE, "-i", OUTPUT_VIDEO], stderr=subprocess.PIPE, text=True)
    for line in p.stderr.splitlines():
        if "Duration" in line or "Stream" in line:
            print(f"  {line.strip()}")

    file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"  File size: {file_size_mb:.2f} MB")

    # Clean temporary frame directories and intermediate render files
    shutil.rmtree("temp_intro", ignore_errors=True)
    shutil.rmtree("temp_outro", ignore_errors=True)
    shutil.rmtree("temp_frames", ignore_errors=True)
    
    for temp_f in ["intro.mp4", "outro.mp4", "video_30s_no_audio.mp4", "test_combined_video.mp4", "test_intro_pipe.mp4", "test_audio_mix.aac"]:
        if os.path.exists(temp_f):
            try:
                os.remove(temp_f)
            except Exception:
                pass
    print("Cleaned up temporary working files and directories.")

    # Synchronize final outputs to website/ directory for git tracking
    website_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "website")
    if os.path.isdir(website_dir):
        dest_video = os.path.join(website_dir, OUTPUT_VIDEO)
        shutil.copy2(OUTPUT_VIDEO, dest_video)
        print(f"Synced deliverable to repository: {dest_video}")
        dest_script = os.path.join(website_dir, os.path.basename(__file__))
        shutil.copy2(__file__, dest_script)
        print(f"Synced builder script to repository: {dest_script}")

if __name__ == "__main__":
    generate_voiceover()
    generate_ambient_audio()
    render_cards()
    assemble_video_crossfades()
    export_final_video()
    verify_output()
