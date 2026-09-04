"""MongoDB client and user persistence for PactLens authentication."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def _clean_mongo_uri(raw: str) -> str:
    cleaned = raw.strip()
    # If user left angle brackets around password e.g. <sanya@2104@>, sanitize them
    if "mongodb" in cleaned and ("<" in cleaned or ">" in cleaned):
        # Remove literal < and > around credentials
        cleaned = cleaned.replace("<", "").replace(">", "")
    return cleaned


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        raw_uri = os.getenv("MONGODB_URI") or os.getenv("PACTLENS_DB") or "mongodb://localhost:27017/pactlens"
        cleaned_uri = _clean_mongo_uri(raw_uri)
        try:
            client = MongoClient(cleaned_uri, serverSelectionTimeoutMS=4000)
            client.admin.command("ping")
            _client = client
            print(f"[MongoDB Auth] Successfully connected to MongoDB ({cleaned_uri.split('@')[-1] if '@' in cleaned_uri else 'local'}).")
        except Exception as err:
            print(f"[MongoDB Auth] Remote/configured MongoDB unreachable ({err}). Falling back to local MongoDB.")
            _client = MongoClient("mongodb://localhost:27017/pactlens", serverSelectionTimeoutMS=5000)
    return _client



def get_mongo_db() -> Database:
    global _db
    if _db is None:
        client = get_mongo_client()
        db_name = os.getenv("MONGODB_DB_NAME", "pactlens")
        _db = client[db_name]
        _init_indexes(_db["users"])
    return _db


def get_users_collection() -> Collection:
    return get_mongo_db()["users"]


def _init_indexes(col: Collection) -> None:
    try:
        col.create_index([("email", ASCENDING)], unique=True, sparse=True)
        col.create_index([("phone_number", ASCENDING)], unique=True, sparse=True)
    except Exception as e:
        # Graceful warning if index already exists or server connecting
        print(f"[MongoDB Auth] Index creation note: {e}")


def serialize_user(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    data = dict(doc)
    if "_id" in data:
        data["id"] = str(data.pop("_id"))
    data.pop("password_hash", None)
    return data


def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    col = get_users_collection()
    try:
        oid = ObjectId(user_id)
        return col.find_one({"_id": oid})
    except Exception:
        return col.find_one({"_id": user_id})


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    col = get_users_collection()
    return col.find_one({"email": email.strip().lower()})


def find_user_by_phone(phone_number: str) -> Optional[Dict[str, Any]]:
    col = get_users_collection()
    return col.find_one({"phone_number": phone_number.strip()})


def find_user_by_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    col = get_users_collection()
    cleaned = identifier.strip()
    return col.find_one({
        "$or": [
            {"email": cleaned.lower()},
            {"phone_number": cleaned},
        ]
    })


def create_user_record(
    name: str,
    email: str,
    phone_number: str,
    password_hash: str,
) -> Dict[str, Any]:
    col = get_users_collection()
    now = datetime.now(timezone.utc)
    doc = {
        "name": name.strip(),
        "email": email.strip().lower(),
        "phone_number": phone_number.strip(),
        "password_hash": password_hash,
        "created_at": now,
        "updated_at": now,
    }
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc
