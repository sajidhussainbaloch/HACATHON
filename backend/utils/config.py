"""
RealityCheck AI — Configuration Module
Loads environment variables and defines app-wide constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ──────────────────────────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")

# ── Model endpoints ──────────────────────────────────────────────────────────
CLOUDFLARE_LLM_URL = (
    f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}"
    f"/ai/run/@cf/mistral/mistral-7b-instruct-v0.1"
)

HUGGINGFACE_EMBEDDING_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
)

# ── Limits & Defaults ────────────────────────────────────────────────────────
MAX_INPUT_CHARS = 5000          # Max characters accepted from user
LLM_MAX_TOKENS = 1024           # Max tokens for LLM generation
LLM_TEMPERATURE = 0.2           # Low temperature for deterministic output
EMBEDDING_DIM = 384             # Dimension of all-MiniLM-L6-v2 embeddings
TOP_K_RESULTS = 5               # Number of similar articles to retrieve
EMBEDDING_CACHE_SIZE = 512      # LRU cache size for embeddings

# ── Trusted Knowledge-Base seed articles ──────────────────────────────────────
SEED_ARTICLES = [
    {
        "title": "WHO COVID-19 Vaccine Safety Update",
        "source": "World Health Organization",
        "url": "https://www.who.int/news/vaccines",
        "text": (
            "COVID-19 vaccines approved by WHO have undergone rigorous testing "
            "through clinical trials involving tens of thousands of participants. "
            "Serious side effects are extremely rare. The benefits of vaccination "
            "far outweigh the risks."
        ),
    },
    {
        "title": "Climate Change: Scientific Consensus",
        "source": "NASA",
        "url": "https://climate.nasa.gov/scientific-consensus/",
        "text": (
            "Multiple studies published in peer-reviewed scientific journals show "
            "that 97% or more of actively publishing climate scientists agree that "
            "climate-warming trends over the past century are extremely likely due "
            "to human activities."
        ),
    },
    {
        "title": "5G and Health — Fact Check",
        "source": "Reuters Fact Check",
        "url": "https://www.reuters.com/fact-check",
        "text": (
            "There is no credible scientific evidence linking 5G networks to "
            "health problems. The radio waves used by 5G are non-ionizing and "
            "fall well within international safety guidelines set by ICNIRP."
        ),
    },
    {
        "title": "Election Integrity Systems in the US",
        "source": "CISA (Cybersecurity & Infrastructure Security Agency)",
        "url": "https://www.cisa.gov/election-security",
        "text": (
            "The 2020 US presidential election was the most secure in American "
            "history according to a joint statement by CISA and the Election "
            "Infrastructure Government Coordinating Council. There is no evidence "
            "of widespread voter fraud."
        ),
    },
    {
        "title": "Flat Earth Claims Debunked",
        "source": "National Geographic",
        "url": "https://www.nationalgeographic.com",
        "text": (
            "The Earth is an oblate spheroid, confirmed by centuries of scientific "
            "observation, satellite imagery, and physics. Claims that the Earth is "
            "flat have no basis in scientific evidence."
        ),
    },
    {
        "title": "Moon Landing Verification",
        "source": "NASA",
        "url": "https://www.nasa.gov/mission_pages/apollo/missions/",
        "text": (
            "NASA's Apollo program successfully landed humans on the Moon six "
            "times between 1969 and 1972. This has been independently verified by "
            "multiple countries and independent researchers using laser ranging "
            "reflectors left on the lunar surface."
        ),
    },
    {
        "title": "GMO Food Safety Consensus",
        "source": "National Academies of Sciences",
        "url": "https://www.nationalacademies.org",
        "text": (
            "A comprehensive review by the National Academies of Sciences found "
            "no substantiated evidence that foods from genetically engineered "
            "crops are less safe than foods from non-GE crops. Over 2,000 studies "
            "have been conducted on the safety of GMO foods."
        ),
    },
    {
        "title": "Misinformation Spreads Faster than Truth",
        "source": "MIT Media Lab / Science Journal",
        "url": "https://science.sciencemag.org",
        "text": (
            "A 2018 MIT study published in Science found that false news stories "
            "are 70% more likely to be retweeted than true stories. Falsehoods "
            "spread faster and reach more people than accurate information on "
            "social media platforms."
        ),
    },
    {
        "title": "AI-Generated Deepfakes: Identification",
        "source": "IEEE / Digital Forensics",
        "url": "https://www.ieee.org",
        "text": (
            "AI-generated deepfake videos and images can often be identified by "
            "subtle artifacts such as inconsistent lighting, unnatural blinking "
            "patterns, and blurred edges around facial features. Reverse image "
            "search and metadata analysis are recommended verification methods."
        ),
    },
    {
        "title": "Health Misinformation: Common Patterns",
        "source": "World Health Organization",
        "url": "https://www.who.int/health-topics/infodemic",
        "text": (
            "Health misinformation typically follows patterns including: appeals "
            "to emotion over evidence, claims of conspiracy, citation of "
            "non-peer-reviewed sources, and promotion of unproven miracle cures. "
            "Always verify health claims with official health organizations."
        ),
    },
]
