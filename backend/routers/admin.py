import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import AdminUser
from services.auth import get_current_user_id
from services.database import get_db
from services.models import Application as ApplicationDB

CLERK_API = "https://api.clerk.com/v1"

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _clerk(method: str, path: str, params: dict | None = None):
    response = httpx.request(
        method,
        f"{CLERK_API}{path}",
        headers={"Authorization": f"Bearer {os.getenv('CLERK_SECRET_KEY', '')}"},
        params=params,
        timeout=10,
    )
    response.raise_for_status()
    return response.json() if response.content else None


def require_admin(user_id: str = Depends(get_current_user_id)) -> str:
    user = _clerk("GET", f"/users/{user_id}")
    if user.get("public_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id


def _guard_target(admin_id: str, target_id: str) -> None:
    if target_id == admin_id:
        raise HTTPException(status_code=400, detail="You cannot change your own account here")
    target = _clerk("GET", f"/users/{target_id}")
    if target.get("public_metadata", {}).get("role") == "admin":
        raise HTTPException(status_code=400, detail="You cannot change another admin")


@router.get("/users")
def list_users(db: Session = Depends(get_db), _admin: str = Depends(require_admin)) -> list[AdminUser]:
    data = _clerk("GET", "/users", params={"limit": 100, "order_by": "-created_at"})
    users = data["data"] if isinstance(data, dict) else data

    counts = dict(
        db.query(ApplicationDB.owner_id, func.count(ApplicationDB.id))
        .group_by(ApplicationDB.owner_id)
        .all()
    )

    result = []
    for u in users:
        primary_id = u.get("primary_email_address_id")
        email = next(
            (e["email_address"] for e in u.get("email_addresses", []) if e["id"] == primary_id),
            None,
        )
        name = " ".join(part for part in (u.get("first_name"), u.get("last_name")) if part)
        result.append(AdminUser(
            id=u["id"],
            name=name or "—",
            email=email,
            image_url=u.get("image_url"),
            created_at=u.get("created_at"),
            last_sign_in_at=u.get("last_sign_in_at"),
            application_count=counts.get(u["id"], 0),
            banned=u.get("banned", False),
        ))
    return result


@router.post("/users/{user_id}/ban")
def ban_user(user_id: str, admin_id: str = Depends(require_admin)):
    _guard_target(admin_id, user_id)
    _clerk("POST", f"/users/{user_id}/ban")
    return {"status": "banned"}


@router.post("/users/{user_id}/unban")
def unban_user(user_id: str, admin_id: str = Depends(require_admin)):
    _guard_target(admin_id, user_id)
    _clerk("POST", f"/users/{user_id}/unban")
    return {"status": "active"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    _guard_target(admin_id, user_id)
    _clerk("DELETE", f"/users/{user_id}")
    db.query(ApplicationDB).filter(ApplicationDB.owner_id == user_id).delete()
    db.commit()
    return {"status": "deleted"}
