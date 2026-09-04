"""
NLP module — semantic similarity via TF-IDF embeddings + cosine.

Used by clause matching. No LLM. Deterministic.
"""

from __future__ import annotations

import re
from typing import Sequence

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def normalize_text(text: str) -> str:
    t = (text or "").lower()
    t = re.sub(r"[^\w\s₹$%./-]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def embed_texts(texts: Sequence[str]) -> tuple[TfidfVectorizer, np.ndarray]:
    """Fit TF-IDF on corpus; return vectorizer and dense-ish sparse matrix."""
    docs = [normalize_text(t) for t in texts]
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
        stop_words="english",
    )
    matrix = vectorizer.fit_transform(docs)
    return vectorizer, matrix


def pairwise_cosine(a_matrix, b_matrix) -> np.ndarray:
    """Cosine similarity matrix between two TF-IDF matrices."""
    return cosine_similarity(a_matrix, b_matrix)


def semantic_similarity(text_a: str, text_b: str) -> float:
    """Single-pair semantic similarity score in [0, 1]."""
    if not (text_a or "").strip() or not (text_b or "").strip():
        return 0.0
    _, matrix = embed_texts([text_a, text_b])
    sim = cosine_similarity(matrix[0:1], matrix[1:2])[0, 0]
    return float(sim)


def batch_similarity(old_texts: Sequence[str], new_texts: Sequence[str]) -> np.ndarray:
    """
    Build a |old| x |new| cosine similarity matrix using a shared TF-IDF space.
    """
    if not old_texts or not new_texts:
        return np.zeros((len(old_texts), len(new_texts)))
    corpus = list(old_texts) + list(new_texts)
    _, matrix = embed_texts(corpus)
    old_mat = matrix[: len(old_texts)]
    new_mat = matrix[len(old_texts) :]
    return pairwise_cosine(old_mat, new_mat)
