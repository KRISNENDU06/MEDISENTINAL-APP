from io import BytesIO
import logging
from fastapi import APIRouter, Query, Response
from pydantic import BaseModel

try:
    import edge_tts
except ImportError:
    edge_tts = None

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

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

# Complete Odia to Devanagari Phonetic Mapping Dictionary
ODIA_CHAR_MAP = {
    # Vowels
    '\u0B05': 'अ', '\u0B06': 'आ', '\u0B07': 'इ', '\u0B08': 'ई',
    '\u0B09': 'उ', '\u0B0A': 'ऊ', '\u0B0B': 'ऋ', '\u0B0C': 'ऌ',
    '\u0B0F': 'ए', '\u0B10': 'ऐ', '\u0B13': 'ओ', '\u0B14': 'औ',
    # Consonants
    '\u0B15': 'क', '\u0B16': 'ख', '\u0B17': 'ग', '\u0B18': 'घ', '\u0B19': 'ङ',
    '\u0B1A': 'च', '\u0B1B': 'छ', '\u0B1C': 'ज', '\u0B1D': 'झ', '\u0B1E': 'ञ',
    '\u0B1F': 'ट', '\u0B20': 'ठ', '\u0B21': 'ड', '\u0B22': 'ढ', '\u0B23': 'ण',
    '\u0B24': 'त', '\u0B25': 'थ', '\u0B26': 'द', '\u0B27': 'ध', '\u0B28': 'न',
    '\u0B2A': 'प', '\u0B2B': 'फ', '\u0B2C': 'ब', '\u0B2D': 'भ', '\u0B2E': 'म',
    '\u0B2F': 'य', '\u0B30': 'र', '\u0B32': 'ल', '\u0B33': 'ल', '\u0B35': 'व',
    '\u0B36': 'श', '\u0B37': 'ष', '\u0B38': 'स', '\u0B39': 'ह',
    # Special Consonants
    '\u0B5F': 'य', '\u0B71': 'व', '\u0B5C': 'ड़', '\u0B5D': 'ढ़',
    # Matras / Vowel signs
    '\u0B3E': 'ा', '\u0B3F': 'ि', '\u0B40': 'ी', '\u0B41': 'ु',
    '\u0B42': 'ू', '\u0B43': 'ृ', '\u0B44': 'ॄ',
    '\u0B47': 'े', '\u0B48': 'ै', '\u0B4B': 'ो', '\u0B4C': 'ौ',
    # Virama / Halanta
    '\u0B4D': '्',
    # Modifiers
    '\u0B01': 'ँ', '\u0B02': 'ं', '\u0B03': 'ः', '\u0B3C': '़',
    # Avagraha & digits
    '\u0B3D': 'ऽ',
    '\u0B66': '०', '\u0B67': '१', '\u0B68': '२', '\u0B69': '३', '\u0B6A': '४',
    '\u0B6B': '५', '\u0B6C': '६', '\u0B6D': '७', '\u0B6E': '८', '\u0B6F': '९',
}

# In-memory audio cache: (hash_key) -> bytes
_AUDIO_CACHE: dict[str, bytes] = {}


def odia_to_phonetic_indic(text: str) -> str:
    """
    Converts Odia unicode text to clean, highly-pronounceable Devanagari Indic phonemes.
    Prevents unpronounceable unicode code points from causing TTS dropouts.
    """
    res = []
    for ch in text:
        res.append(ODIA_CHAR_MAP.get(ch, ch))
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
    if edge_tts is not None:
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
    if gTTS is not None:
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

    # Fallback minimal valid MP3 frame
    return b"\xff\xfb\x90\x04\x00\x00\x00\x00\x00\x00\x00\x00"


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
