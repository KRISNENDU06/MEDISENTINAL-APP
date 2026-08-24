from io import BytesIO
import logging
from fastapi import APIRouter, Query, Response
from pydantic import BaseModel
import edge_tts
from gtts import gTTS

router = APIRouter(prefix="/audio", tags=["Audio & Multilingual TTS"])
logger = logging.getLogger(__name__)

# Pre-defined high quality advisory texts
DEFAULT_ADVISORIES = {
    "odia": (
        "ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା ବୁଲେଟିନ୍। ମେଡିସେଣ୍ଟିନେଲ୍ ସର୍ଭିଲାନ୍ସ ତରଫରୁ ସମସ୍ତ ନାଗରିକଙ୍କୁ ସୂଚନା। "
        "ନିଜ ଘର ପାଖରେ ଜମି ରହିଥିବା ପାଣି ନଷ୍ଟ କରନ୍ତୁ, ମଶା ଧୂଆଁ ବ୍ୟବହାର କରନ୍ତୁ, "
        "ଏବଂ ଜ୍ୱର କିମ୍ବା ଶରୀର ଯନ୍ତ୍ରଣା ହେଲେ ତୁରନ୍ତ ନିକଟସ୍ଥ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯାଆନ୍ତୁ।"
    ),
    "hindi": (
        "जन स्वास्थ्य बुलेटिन। मेडीसेंटिनल सर्विलांस द्वारा सभी नागरिकों को सूचित किया जाता है कि "
        "घर के आसपास जलजमाव न होने दें, मच्छरदानी का प्रयोग करें, "
        "और तेज बुखार या कमजोरी होने पर तुरंत नजदीकी स्वास्थ्य केंद्र पर जाएं।"
    ),
    "english": (
        "Public Health Advisory from MediSentinel Early Warning Platform. "
        "Inspect water containers, prevent mosquito breeding, maintain proper hydration with ORS, "
        "and visit your nearest Urban Primary Health Center if fever symptoms persist."
    ),
}

# In-memory audio cache: (hash_key) -> bytes
_AUDIO_CACHE: dict[str, bytes] = {}


def odia_to_phonetic_indic(text: str) -> str:
    """
    Converts Odia unicode characters (0x0B00-0x0B7F) to exact phonetic Devanagari (0x0900-0x097F).
    This allows neural Indic TTS models (Swara/Madhur) to flawlessly pronounce Odia words with authentic accent.
    """
    res = []
    for ch in text:
        code = ord(ch)
        if 0x0B00 <= code <= 0x0B7F:
            # 0x0B00 - 0x0900 = 0x0200
            dev_code = code - 0x0200
            res.append(chr(dev_code))
        else:
            res.append(ch)
    return "".join(res)


async def synthesize_speech(text: str, lang: str) -> bytes:
    """Synthesizes speech into MP3 bytes using Edge-TTS with gTTS fallback."""
    lang_clean = lang.strip().lower()
    is_odia = lang_clean in ("odia", "or", "ory", "or-in", "odia (ଓଡ଼ିଆ)")
    is_hindi = lang_clean in ("hindi", "hi", "hi-in", "hindi (हिन्दी)")

    cache_key = f"{lang_clean}::{text.strip()}"
    if cache_key in _AUDIO_CACHE:
        return _AUDIO_CACHE[cache_key]

    # Prepare spoken text & neural voice
    if is_odia:
        spoken_text = odia_to_phonetic_indic(text)
        voice = "hi-IN-SwaraNeural"
    elif is_hindi:
        spoken_text = text
        voice = "hi-IN-SwaraNeural"
    else:
        spoken_text = text
        voice = "en-IN-NeerjaNeural"

    # 1. Primary: Microsoft Edge Neural TTS (natural human cadence)
    try:
        communicate = edge_tts.Communicate(spoken_text, voice, rate="+0%", pitch="+0Hz")
        mp3_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_buffer.extend(chunk["data"])

        if len(mp3_buffer) > 1000:
            result = bytes(mp3_buffer)
            _AUDIO_CACHE[cache_key] = result
            return result
    except Exception as e:
        logger.warning(f"Edge TTS synthesis failed for {lang}: {e}. Falling back to gTTS.")

    # 2. Secondary: Google TTS fallback
    try:
        gtts_lang = "hi" if (is_odia or is_hindi) else "en"
        tts = gTTS(text=spoken_text if is_odia else text, lang=gtts_lang)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        result = fp.getvalue()
        _AUDIO_CACHE[cache_key] = result
        return result
    except Exception as e:
        logger.error(f"gTTS fallback also failed for {lang}: {e}")
        raise


class TTSRequest(BaseModel):
    text: str
    lang: str = "english"


@router.get("/tts")
async def get_text_to_speech(
    lang: str = Query("english", description="Language: 'odia', 'hindi', or 'english'"),
    text: str | None = Query(None, description="Custom text to speak (defaults to standard advisory)")
):
    """
    Streams MP3 audio for Odia, Hindi, or English text.
    Crystal-clear native pronunciation for public health advisories and health reports.
    """
    clean_lang = lang.strip().lower()
    if not text or not text.strip():
        if clean_lang in ("odia", "or", "ory"):
            text = DEFAULT_ADVISORIES["odia"]
        elif clean_lang in ("hindi", "hi"):
            text = DEFAULT_ADVISORIES["hindi"]
        else:
            text = DEFAULT_ADVISORIES["english"]

    audio_bytes = await synthesize_speech(text, clean_lang)

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="advisory_{clean_lang}.mp3"',
            "Cache-Control": "public, max-age=86400",
            "Accept-Ranges": "bytes",
        },
    )


@router.post("/tts")
async def post_text_to_speech(payload: TTSRequest):
    """Generates MP3 audio for custom text payloads (e.g. Ward Directives, Chatbot answers)."""
    text = payload.text.strip()
    if not text:
        text = DEFAULT_ADVISORIES.get(payload.lang.lower(), DEFAULT_ADVISORIES["english"])

    audio_bytes = await synthesize_speech(text, payload.lang)

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="speech_{payload.lang}.mp3"',
            "Cache-Control": "public, max-age=86400",
        },
    )
