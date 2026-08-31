"""SQLite persistence for scans, findings, evidence, reminders."""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    create_engine,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = os.getenv("PACTLENS_DB", str(DATA_DIR / "pactlens.db"))

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(64), unique=True, index=True, nullable=False)
    contract_name = Column(String(255), nullable=False)
    contract_type = Column(String(64), nullable=False)
    status = Column(String(32), default="Watching")  # Watching | Resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    risk_high = Column(Integer, default=0)
    risk_medium = Column(Integer, default=0)
    risk_low = Column(Integer, default=0)
    old_filename = Column(String(255))
    new_filename = Column(String(255))
    old_hash = Column(String(64))
    new_hash = Column(String(64))
    combined_hash = Column(String(64))
    pipeline_json = Column(Text)  # full detection+explain payload
    stages_json = Column(Text)

    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="scan", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True)
    scan_pk = Column(Integer, ForeignKey("scans.id"))
    rule_id = Column(String(64))
    severity = Column(String(16))
    payload_json = Column(Text)

    scan = relationship("Scan", back_populates="findings")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True)
    scan_pk = Column(Integer, ForeignKey("scans.id"))
    finding_rule_id = Column(String(64))
    label = Column(String(255))
    due_date = Column(String(32))
    created_at = Column(DateTime, default=datetime.utcnow)
    done = Column(Integer, default=0)

    scan = relationship("Scan", back_populates="reminders")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
