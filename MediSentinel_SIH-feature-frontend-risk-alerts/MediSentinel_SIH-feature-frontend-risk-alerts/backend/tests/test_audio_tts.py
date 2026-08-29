import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.audio import odia_to_phonetic_indic

client = TestClient(app)


def test_odia_to_phonetic_indic_mapping():
    odia_sample = "ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା ବୁଲେଟିନ୍"
    devanagari = odia_to_phonetic_indic(odia_sample)
    # Ensure transliterated characters are in Devanagari range
    assert len(devanagari) == len(odia_sample)
    assert any(0x0900 <= ord(c) <= 0x097F for c in devanagari)


def test_audio_tts_odia_get():
    response = client.get("/api/audio/tts?lang=odia")
    assert response.status_code == 200
    assert response.headers.get("content-type") == "audio/mpeg"
    assert len(response.content) > 1000


def test_audio_tts_hindi_get():
    response = client.get("/api/audio/tts?lang=hindi")
    assert response.status_code == 200
    assert response.headers.get("content-type") == "audio/mpeg"
    assert len(response.content) > 1000


def test_audio_tts_english_get():
    response = client.get("/api/audio/tts?lang=english")
    assert response.status_code == 200
    assert response.headers.get("content-type") == "audio/mpeg"
    assert len(response.content) > 1000


def test_audio_tts_custom_post():
    payload = {
        "text": "ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା: ନିଜ ପରିବେଶ ପରିଷ୍କାର ରଖନ୍ତୁ।",
        "lang": "odia",
    }
    response = client.post("/api/audio/tts", json=payload)
    assert response.status_code == 200
    assert response.headers.get("content-type") == "audio/mpeg"
    assert len(response.content) > 1000
