"""
Learning Engine
After each resolved incident, store the pattern → solution in:
  1. MongoDB (structured)
  2. ChromaDB (vector embeddings for semantic similarity search)

Future incidents benefit from past solutions.
"""
import logging
from datetime import datetime
from typing import List, Optional

from app.models.schemas import (
    Incident, IncidentStatus, IncidentType, KnowledgeEntry, RemediationAction
)
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────────────────────────────────────────────────────────
# ChromaDB vector store (optional — gracefully degrades if not available)
# ─────────────────────────────────────────────────────────────────────────────

def _get_chroma_collection():
    try:
        import chromadb
        client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        return client.get_or_create_collection("incident_knowledge")
    except Exception as e:
        logger.warning(f"ChromaDB unavailable: {e}")
        return None


def _embed(text: str) -> Optional[List[float]]:
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        return model.encode(text).tolist()
    except Exception as e:
        logger.warning(f"Embedding failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Learning Engine
# ─────────────────────────────────────────────────────────────────────────────

class LearningEngine:
    async def learn(self, incident: Incident):
        """Called after an incident is resolved. Stores knowledge."""
        if incident.status not in (IncidentStatus.RESOLVED,):
            return
        if not incident.diagnosis or not incident.remediation:
            return
        if not incident.remediation.success:
            return

        logger.info(f"📚 Learning from {incident.incident_id}")

        pattern_text = (
            f"Service {incident.service} experienced {incident.incident_type}. "
            f"Root cause: {incident.diagnosis.root_cause}. "
            f"Resolved with: {incident.remediation.action}."
        )

        entry = KnowledgeEntry(
            incident_type=incident.incident_type,
            pattern_description=pattern_text,
            successful_action=incident.remediation.action,
            confidence_boost=0.05,
            occurrence_count=1,
            last_seen=datetime.utcnow(),
        )

        # Store in MongoDB
        try:
            from app.services.mongodb_service import upsert_knowledge
            await upsert_knowledge(entry)
            logger.info("  ✅ Stored in MongoDB knowledge base")
        except Exception as e:
            logger.warning(f"  MongoDB knowledge store failed: {e}")

        # Store in ChromaDB (vector search)
        try:
            embedding = _embed(pattern_text)
            if embedding:
                collection = _get_chroma_collection()
                if collection:
                    collection.upsert(
                        ids=[entry.entry_id],
                        embeddings=[embedding],
                        documents=[pattern_text],
                        metadatas=[{
                            "incident_type": incident.incident_type,
                            "action": incident.remediation.action,
                            "service": incident.service,
                        }],
                    )
                    logger.info("  ✅ Stored in ChromaDB vector KB")
        except Exception as e:
            logger.warning(f"  ChromaDB store failed: {e}")

    async def recall(self, incident_type: IncidentType, description: str) -> Optional[RemediationAction]:
        """
        Given a new incident, recall the most similar past solution.
        Returns the RemediationAction from the closest past incident.
        """
        # 1. Try vector search in ChromaDB
        try:
            embedding = _embed(description)
            if embedding:
                collection = _get_chroma_collection()
                if collection:
                    results = collection.query(
                        query_embeddings=[embedding],
                        n_results=1,
                        where={"incident_type": incident_type},
                    )
                    if results["metadatas"] and results["metadatas"][0]:
                        action_str = results["metadatas"][0][0].get("action")
                        if action_str:
                            return RemediationAction(action_str)
        except Exception as e:
            logger.debug(f"ChromaDB recall failed: {e}")

        # 2. Fall back to MongoDB structured lookup
        try:
            from app.services.mongodb_service import get_knowledge
            entries = await get_knowledge(incident_type)
            if entries:
                # Return most frequently successful action
                best = max(entries, key=lambda e: e.occurrence_count)
                return best.successful_action
        except Exception as e:
            logger.debug(f"MongoDB recall failed: {e}")

        return None
