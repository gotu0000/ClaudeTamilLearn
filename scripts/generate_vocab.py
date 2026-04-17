#!/usr/bin/env python3
"""
Tamil Vocabulary Generator
Run: ANTHROPIC_API_KEY=sk-ant-... python3 scripts/generate_vocab.py
Output: src/data/vocab-data.json (crash-safe, saves after each topic)
"""
import json, os, sys, time, pathlib

try:
    import anthropic
except ImportError:
    print("pip install anthropic")
    sys.exit(1)

SCRIPT_DIR = pathlib.Path(__file__).parent
OUT = SCRIPT_DIR.parent / "src" / "data" / "vocab-data.json"

TOPICS = [
    ("verbs", "Common Verbs", 50, "Essential Tamil action verbs in spoken form: go, come, eat, drink, see, hear, speak, tell, write, read, run, walk, sleep, wake, sit, stand, think, know, understand, give, take, want, like, do, open, close, buy, sell, search, find, keep, bring, send, call, show, learn, teach, play, sing, dance, cry, laugh, help, stop, start, finish, cook, wash, wear, return, climb, fall, hit, throw, win, live, grow, change, forget, believe"),
    ("greetings", "Greetings & Basics", 40, "Greetings, politeness words, pronouns (I/you/he/she/they/we), possessives, demonstratives (this/that), basic adverbs (here/there/now/today/tomorrow/yesterday/very/a little/also/only/still/already/never/always)"),
    ("emotions", "Emotions", 35, "Feelings used in Tamil movies: happy, sad, angry, afraid, love, desire, hope, pain, surprise, worry, jealousy, shy, proud, joy, disappointed, brave, peaceful, tears, laughter, crying, hatred, affection, lonely, excitement, nervousness, satisfaction, betrayal, revenge, determination, gratitude, guilt"),
    ("questions", "Questions & Connectors", 40, "Question words (what/why/when/where/who/how/how much/how many/which) and connectors (and/but/because/if/then/so/also/only/still/already/always/sometimes/or/before/after/until/without/like/than/very/all/nothing/something/someone/everyone/no one/everywhere/maybe/definitely)"),
    ("numbers", "Numbers & Time", 35, "Numbers 1-10, 20, 50, 100, 1000. Time words: morning/afternoon/evening/night. Days Monday-Sunday. Month, year, hour, minute, today, tomorrow, yesterday, first, last"),
    ("food", "Food & Drink", 35, "Tamil foods: rice/sambar/rasam/dosa/idli/vadai/biryani/chicken/fish/egg/vegetable/dal/curd/buttermilk/milk/water/coffee/tea. Spices: salt/pepper/chili/sugar/oil/coconut. Tastes: spicy/sweet/sour. Meals: breakfast/lunch/dinner. hunger/thirst/taste/fruit"),
    ("family", "Family & People", 30, "Tamil kinship: mother/father/elder brother/sister/younger brother/sister/son/daughter/grandfather/grandmother/uncle/aunt/husband/wife/child/family/friend/boy/girl/man/woman/neighbor/guest/marriage/age"),
    ("colors", "Colors & Adjectives", 30, "Colors: red/blue/green/yellow/white/black. Adjectives: big/small/tall/short/beautiful/good/bad/new/old/clean/dirty/hot/cold/fast/slow/hard/soft/strong/weak/expensive/cheap/correct/wrong/rich/poor"),
    ("movies", "Movie & Entertainment", 35, "Movie vocabulary: film/song/dance/hero/heroine/villain/story/scene/dialogue/fight/comedy/romance/revenge/justice/fate/promise/victory/defeat/power/life/death/truth/lie/escape/police/court/prison/king/queen/sword/blood/music/camera/ticket/cinema"),
    ("body", "Body & Health", 30, "Body: head/hair/face/eye/ear/nose/mouth/teeth/neck/hand/finger/stomach/back/leg/foot/bone/blood/heart/brain. Health: fever/cold/cough/headache/pain/wound/medicine/doctor/hospital/healthy/sick/tired"),
    ("daily", "Daily Routines", 25, "Daily activities: wake up/brush/bathe/dress/comb/work/clean/sweep/wash/iron/watch TV/study/exercise/pray/sleep/dream/alarm/late/early/hurry/ready/rest/holiday/busy/free time"),
    ("home", "Home & Objects", 30, "House/room/door/window/wall/floor/kitchen/bedroom/bathroom/garden/chair/table/bed/cupboard/mirror/fan/light/key/lock/clock/book/pen/umbrella/soap/towel/pillow/blanket/broom/TV/fridge"),
    ("nature", "Nature & Weather", 25, "Tree/flower/leaf/forest/mountain/river/sea/stone/sky/sun/moon/star/cloud/rain/wind/storm/thunder/fire/water/sunlight/jasmine/lotus/rainbow/earth/wave"),
    ("travel", "Travel & Directions", 25, "Bus/train/auto/car/bike/airplane/boat. Directions: left/right/straight/turn/front/back/near/far/inside/outside/above/below/road/signal/station/ticket/address/way/distance/map"),
    ("shopping", "Shopping & Money", 20, "Shop/market/buy/sell/price/cost/money/rupees/change/bill/discount/free/pay/wallet/bag/kilogram/size/bargain/expensive/cheap"),
    ("work", "Work & Education", 25, "Job/work/office/company/boss/salary/meeting/computer/school/college/teacher/student/class/exam/marks/pass/fail/study/learn/doctor/engineer/lawyer/farmer/driver/book"),
    ("places", "Places & Buildings", 20, "Temple/church/mosque/hospital/school/market/restaurant/hotel/bank/police station/cinema/park/library/bus stand/railway station/village/city/town/country/post office"),
    ("clothing", "Clothing", 20, "Shirt/pants/saree/veshti/lungi/jacket/ring/chain/bangle/watch/belt/glasses/shoe/sandal/silk/cotton/stitch/tear/wear/remove"),
    ("animals", "Animals", 25, "Dog/cat/cow/goat/horse/chicken/elephant/tiger/lion/monkey/deer/rabbit/rat/snake/crow/parrot/peacock/pigeon/ant/mosquito/fish/frog/turtle/butterfly/spider"),
    ("phrases", "Useful Phrases", 35, "Common Tamil phrases: I don't know/come quickly/what happened/no problem/very good/I'm coming/one minute/leave it/don't lie/tell the truth/I swear/believe me/get out/shut up/it's over/no way/definitely/let's see/don't worry/be careful/well done/I can't/I can/what do you want/forgive me/thank God/oh my God/I'll handle it/mind your business/say again/slowly please/help me/I don't understand/that's enough/stop it"),
]

def generate(client, title, count, desc):
    prompt = f"""Generate {count} Tamil vocabulary words and 10 sentences for "{title}".

Topic details: {desc}

Return ONLY valid JSON. No markdown. No explanation.
{{"words":[{{"tamil":"...","transliteration":"...","english":"..."}}],"sentences":[{{"tamil":"...","transliteration":"...","english":"..."}}]}}

Rules:
- Exactly {count} words, exactly 10 sentences
- Use SPOKEN/COLLOQUIAL Tamil (movie dialogue style), not literary
- Tamil script must be accurate
- Transliteration: intuitive romanization
- English: 1-3 words max
- No duplicate words
- Sentences should use words from the list"""

    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(text)


def main():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        print("Set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=key)

    existing = {}
    if OUT.exists():
        existing = json.loads(OUT.read_text(encoding="utf-8"))
        print(f"Loaded {len(existing)} existing topics")

    total = len(TOPICS)
    for i, (tid, title, count, desc) in enumerate(TOPICS):
        if tid in existing and len(existing[tid].get("words", [])) >= count * 0.8:
            print(f"[{i+1}/{total}] {title} — cached ({len(existing[tid]['words'])} words)")
            continue

        print(f"[{i+1}/{total}] Generating {title} ({count} words)...", end=" ", flush=True)
        try:
            data = generate(client, title, count, desc)
            existing[tid] = data
            wc = len(data.get("words", []))
            sc = len(data.get("sentences", []))
            print(f"✓ {wc} words, {sc} sentences")
            OUT.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"✗ {e}")

        if i < total - 1:
            time.sleep(1.5)

    tw = sum(len(v.get("words", [])) for v in existing.values())
    ts = sum(len(v.get("sentences", [])) for v in existing.values())
    print(f"\nDone: {tw} words, {ts} sentences, {len(existing)} topics → {OUT}")


if __name__ == "__main__":
    main()
