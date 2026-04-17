#!/usr/bin/env python3
"""
Tamil Audio Generator using Sarvam AI Bulbul v3
Run: SARVAM_API_KEY=... python3 scripts/generate_audio.py
Reads: src/data/vocab-data.json
Output: public/audio/{topic_id}/{hash}.mp3 and {hash}_slow.mp3
"""
import json, os, sys, time, hashlib, base64, pathlib

try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

SCRIPT_DIR = pathlib.Path(__file__).parent
VOCAB_PATH = SCRIPT_DIR.parent / "src" / "data" / "vocab-data.json"
AUDIO_DIR = SCRIPT_DIR.parent / "public" / "audio"
API_URL = "https://api.sarvam.ai/text-to-speech"

# Use SHA-256 truncated to 16 hex chars (matches audio.js)
def file_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def generate_audio(api_key, text, speaker="priya", pace=1.0):
    """Call Sarvam TTS API and return MP3 bytes."""
    resp = requests.post(
        API_URL,
        headers={
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "target_language_code": "ta-IN",
            "speaker": speaker,
            "pace": pace,
            "model": "bulbul:v3",
            "output_format": "mp3",
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    # Response contains base64-encoded audio
    audio_b64 = data.get("audios", [None])[0]
    if not audio_b64:
        raise ValueError("No audio in response")
    return base64.b64decode(audio_b64)


def main():
    api_key = os.environ.get("SARVAM_API_KEY")
    if not api_key:
        print("Set SARVAM_API_KEY environment variable")
        sys.exit(1)

    if not VOCAB_PATH.exists():
        print(f"Vocab file not found: {VOCAB_PATH}")
        print("Run generate_vocab.py first")
        sys.exit(1)

    vocab = json.loads(VOCAB_PATH.read_text(encoding="utf-8"))

    # Collect all unique texts to generate
    items = []  # (topic_id, tamil_text)
    for topic_id, data in vocab.items():
        for w in data.get("words", []):
            items.append((topic_id, w["tamil"]))
        for s in data.get("sentences", []):
            items.append((topic_id, s["tamil"]))

    print(f"Total items: {len(items)}")
    print(f"Will generate: {len(items) * 2} audio files (normal + slow)")
    print(f"Output: {AUDIO_DIR}\n")

    generated = 0
    skipped = 0
    errors = 0

    for i, (topic_id, text) in enumerate(items):
        topic_dir = AUDIO_DIR / topic_id
        topic_dir.mkdir(parents=True, exist_ok=True)

        h = file_hash(text)
        normal_path = topic_dir / f"{h}.mp3"
        slow_path = topic_dir / f"{h}_slow.mp3"

        # Skip if both already exist
        if normal_path.exists() and slow_path.exists():
            skipped += 1
            continue

        # Generate normal speed
        if not normal_path.exists():
            try:
                print(f"[{i+1}/{len(items)}] {text[:30]}... (normal)", end=" ", flush=True)
                audio = generate_audio(api_key, text, pace=1.0)
                normal_path.write_bytes(audio)
                print(f"✓ {len(audio)} bytes")
                generated += 1
                time.sleep(0.3)  # Rate limit
            except Exception as e:
                print(f"✗ {e}")
                errors += 1

        # Generate slow speed
        if not slow_path.exists():
            try:
                print(f"[{i+1}/{len(items)}] {text[:30]}... (slow)", end=" ", flush=True)
                audio = generate_audio(api_key, text, pace=0.7)
                slow_path.write_bytes(audio)
                print(f"✓ {len(audio)} bytes")
                generated += 1
                time.sleep(0.3)
            except Exception as e:
                print(f"✗ {e}")
                errors += 1

    print(f"\nDone: {generated} generated, {skipped} skipped, {errors} errors")

    # Calculate total size
    total_size = 0
    for f in AUDIO_DIR.rglob("*.mp3"):
        total_size += f.stat().st_size
    print(f"Total audio size: {total_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
