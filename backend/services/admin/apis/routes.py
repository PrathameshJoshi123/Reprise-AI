from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, load_only
from sqlalchemy import func, desc
from typing import Optional, List
from shared.db.connections import get_db
from services.auth import models as auth_models, utils as auth_utils
from services.sell_phone.schema import models as sell_models
from services.partner.schema.models import Partner, PartnerServiceablePincode
from services.admin.schema.models import (
    Admin, PartnerVerificationHistory, CreditPlan, 
    PartnerCreditTransaction, AdminCreditConfiguration
)
from services.admin import utils as admin_utils
from ..schema.schemas import (
    # Admin auth
    AdminLoginRequest, AdminToken, AdminOut, AdminCreate, AdminUpdate,
    # Partner management
    PartnerOut, PartnerDetailsOut, PartnerVerificationHistoryOut,
    PartnerServiceablePincodeOut, RequestClarificationRequest,
    ApprovePartnerRequest, RejectPartnerRequest,
    # Credit management
    CreditPlanOut, CreditPlanCreate, CreditPlanUpdate,
    PartnerCreditTransactionOut, AdjustCreditsRequest,
    AdminCreditConfigurationOut, UpdateConfigRequest,
    # Dashboard
    DashboardStats,
    # Legacy
    AdminUserCreate, AdminUserUpdate, AdminUserOut, AdminOrderOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================================
# ADMIN AUTHENTICATION
# ============================================================================

@router.post("/auth/login", response_model=AdminToken)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Admin login endpoint.
    Returns JWT token with admin_id and user_type='admin'.
    """
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )
    
    if not admin_utils.verify_password(payload.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    token = admin_utils.create_admin_access_token(data={"admin_id": admin.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": admin
    }


@router.get("/auth/me", response_model=AdminOut)
def get_current_admin_profile(current_admin: Admin = Depends(admin_utils.get_current_admin)):
    """Get current admin profile"""
    return current_admin


@router.post("/auth/admins", response_model=AdminOut, status_code=201)
def create_admin(
    payload: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.require_super_admin)
):
    """
    Create new admin (super_admin only).
    """
    existing = db.query(Admin).filter(Admin.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this email already exists")
    
    hashed_password = admin_utils.get_password_hash(payload.password)
    admin = Admin(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hashed_password,
        role=payload.role,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


# ============================================================================
# PARTNER VERIFICATION MANAGEMENT
# ============================================================================

@router.get("/partners/pending-verification", response_model=List[PartnerOut])
def get_pending_verifications(
    verification_status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """
    Get partners pending verification or in clarification.
    """
    query = db.query(Partner)
    
    if verification_status:
        query = query.filter(Partner.verification_status == verification_status)
    else:
        # Default: show all non-approved partners
        query = query.filter(Partner.verification_status != 'approved')
    
    total = query.count()
    partners = query.order_by(desc(Partner.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    return partners


@router.get("/partners/{partner_id}/verification-details", response_model=PartnerDetailsOut)
def get_partner_verification_details(
    partner_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """
    Get complete partner details including verification history and pincodes.
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    pincodes = db.query(PartnerServiceablePincode).filter(
        PartnerServiceablePincode.partner_id == partner_id
    ).all()
    
    history = db.query(PartnerVerificationHistory).filter(
        PartnerVerificationHistory.partner_id == partner_id
    ).order_by(PartnerVerificationHistory.created_at).all()
    
    return {
        "partner": partner,
        "serviceable_pincodes": pincodes,
        "verification_history": history
    }


@router.post("/partners/{partner_id}/request-clarification", response_model=dict)
def request_partner_clarification(
    partner_id: int,
    payload: RequestClarificationRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """
    Request additional information from partner.
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Update partner status
    partner.verification_status = 'clarification_needed'
    
    # Create verification history entry
    history_entry = PartnerVerificationHistory(
        partner_id=partner_id,
        action_by_admin_id=current_admin.id,
        action_type='clarification_requested',
        message_from_admin=payload.message,
        documents_submitted={"required_documents": payload.required_documents} if payload.required_documents else None
    )
    
    db.add(partner)
    db.add(history_entry)
    db.commit()
    
    # TODO: Create notification for partner
    
    return {
        "status": "success",
        "message": "Clarification requested",
        "partner_id": partner_id,
        "verification_status": partner.verification_status
    }


@router.post("/partners/{partner_id}/approve", response_model=dict)
def approve_partner(
    partner_id: int,
    payload: ApprovePartnerRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """
    Approve partner verification.
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Update partner status
    partner.verification_status = 'approved'
    partner.is_active = True
    
    # Create verification history entry
    history_entry = PartnerVerificationHistory(
        partner_id=partner_id,
        action_by_admin_id=current_admin.id,
        action_type='approved',
        message_from_admin=payload.approval_notes
    )
    
    db.add(partner)
    db.add(history_entry)
    db.commit()
    
    # TODO: Create notification for partner
    
    return {
        "status": "success",
        "message": "Partner approved",
        "partner_id": partner_id,
        "verification_status": partner.verification_status
    }


@router.post("/partners/{partner_id}/reject", response_model=dict)
def reject_partner(
    partner_id: int,
    payload: RejectPartnerRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """
    Reject partner verification.
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Update partner status
    partner.verification_status = 'rejected'
    partner.rejection_reason = payload.rejection_reason
    
    # Create verification history entry
    history_entry = PartnerVerificationHistory(
        partner_id=partner_id,
        action_by_admin_id=current_admin.id,
        action_type='rejected',
        message_from_admin=payload.rejection_reason
    )
    
    db.add(partner)
    db.add(history_entry)
    db.commit()
    
    # TODO: Create notification for partner
    
    return {
        "status": "success",
        "message": "Partner rejected",
        "partner_id": partner_id,
        "verification_status": partner.verification_status
    }


# ============================================================================
# CREDIT MANAGEMENT
# ============================================================================

@router.get("/credit-plans", response_model=List[CreditPlanOut])
def get_credit_plans(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Get all credit plans"""
    return db.query(CreditPlan).order_by(CreditPlan.credit_amount).all()


@router.post("/credit-plans", response_model=CreditPlanOut, status_code=201)
def create_credit_plan(
    payload: CreditPlanCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Create new credit plan"""
    plan = CreditPlan(
        plan_name=payload.plan_name,
        credit_amount=payload.credit_amount,
        price=payload.price,
        bonus_percentage=payload.bonus_percentage,
        description=payload.description,
        is_active=True
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/credit-plans/{plan_id}", response_model=CreditPlanOut)
def update_credit_plan(
    plan_id: int,
    payload: CreditPlanUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Update credit plan"""
    plan = db.query(CreditPlan).filter(CreditPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Credit plan not found")
    
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(plan, field, value)
    
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/credit-plans/{plan_id}")
def delete_credit_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Soft delete credit plan (set is_active=False)"""
    plan = db.query(CreditPlan).filter(CreditPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Credit plan not found")
    
    plan.is_active = False
    db.add(plan)
    db.commit()
    
    return {"message": "Credit plan deactivated"}


@router.post("/partners/{partner_id}/adjust-credits", response_model=dict)
def adjust_partner_credits(
    partner_id: int,
    payload: AdjustCreditsRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """
    Manual credit adjustment (add or deduct).
    Amount can be positive (add) or negative (deduct).
    """
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    balance_before = partner.credit_balance
    new_balance = balance_before + payload.amount
    
    if new_balance < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Current: {balance_before}, Requested: {payload.amount}"
        )
    
    # Update partner balance
    partner.credit_balance = new_balance
    
    # Create transaction record
    transaction = PartnerCreditTransaction(
        partner_id=partner_id,
        transaction_type='adjustment',
        amount=payload.amount,
        balance_before=balance_before,
        balance_after=new_balance,
        reference_type='manual',
        notes=payload.notes,
        created_by_admin_id=current_admin.id
    )
    
    db.add(partner)
    db.add(transaction)
    db.commit()
    
    return {
        "status": "success",
        "message": "Credits adjusted",
        "partner_id": partner_id,
        "amount": payload.amount,
        "new_balance": new_balance,
        "transaction_id": transaction.id
    }


@router.get("/partners/{partner_id}/transactions", response_model=List[PartnerCreditTransactionOut])
def get_partner_transactions(
    partner_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Get partner credit transaction history"""
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    transactions = db.query(PartnerCreditTransaction).filter(
        PartnerCreditTransaction.partner_id == partner_id
    ).order_by(desc(PartnerCreditTransaction.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    return transactions


# ============================================================================
# SYSTEM CONFIGURATION
# ============================================================================

@router.get("/config", response_model=List[AdminCreditConfigurationOut])
def get_system_config(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Get all system configuration"""
    return db.query(AdminCreditConfiguration).all()


@router.put("/config/{config_key}", response_model=dict)
def update_system_config(
    config_key: str,
    payload: UpdateConfigRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Update system configuration value"""
    config = db.query(AdminCreditConfiguration).filter(
        AdminCreditConfiguration.config_key == config_key
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration key not found")
    
    config.config_value = payload.config_value
    config.updated_by_admin_id = current_admin.id
    
    db.add(config)
    db.commit()
    
    return {
        "status": "success",
        "message": "Configuration updated",
        "config_key": config_key,
        "config_value": config.config_value
    }


@router.post("/config", response_model=AdminCreditConfigurationOut, status_code=201)
def create_system_config(
    config_key: str,
    config_value: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Create new system configuration"""
    existing = db.query(AdminCreditConfiguration).filter(
        AdminCreditConfiguration.config_key == config_key
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Configuration key already exists")
    
    config = AdminCreditConfiguration(
        config_key=config_key,
        config_value=config_value,
        description=description,
        updated_by_admin_id=current_admin.id
    )
    
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """Get dashboard statistics"""
    
    # Count customers
    total_customers = db.query(auth_models.User).count()
    
    # Count partners
    total_partners = db.query(Partner).count()
    active_partners = db.query(Partner).filter(
        Partner.verification_status == 'approved',
        Partner.is_active == True
    ).count()
    pending_verifications = db.query(Partner).filter(
        Partner.verification_status.in_(['pending', 'under_review', 'clarification_needed'])
    ).count()
    
    # Count agents (will be implemented in next phase)
    total_agents = 0  # TODO: Implement when agent model is ready
    
    # Count orders
    total_orders = db.query(sell_models.Order).count()
    
    # Orders by status
    status_counts = db.query(
        sell_models.Order.status,
        func.count(sell_models.Order.id)
    ).group_by(sell_models.Order.status).all()
    
    orders_by_status = {status: count for status, count in status_counts}
    
    # Calculate revenue (sum of all lead purchases)
    total_revenue = db.query(
        func.coalesce(func.sum(-PartnerCreditTransaction.amount), 0)
    ).filter(
        PartnerCreditTransaction.transaction_type == 'lead_purchase'
    ).scalar() or 0.0
    
    # Credits in circulation (sum of all partner balances)
    credits_in_circulation = db.query(
        func.coalesce(func.sum(Partner.credit_balance), 0)
    ).scalar() or 0.0
    
    return {
        "total_customers": total_customers,
        "total_partners": total_partners,
        "active_partners": active_partners,
        "pending_verifications": pending_verifications,
        "total_agents": total_agents,
        "total_orders": total_orders,
        "orders_by_status": orders_by_status,
        "total_revenue": float(total_revenue),
        "credits_in_circulation": float(credits_in_circulation)
    }


@router.get("/partners", response_model=List[PartnerOut])
def list_all_partners(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin)
):
    """List all partners with optional filtering"""
    query = db.query(Partner)
    
    if verification_status:
        query = query.filter(Partner.verification_status == verification_status)
    
    partners = query.order_by(desc(Partner.created_at)).offset((page - 1) * limit).limit(limit).all()
    return partners


# ============================================================================
# LEGACY ENDPOINTS (for existing admin UI)
# ============================================================================

@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin),
):
    """
    List users — only load fields required by the admin UI to avoid fetching everything.
    """
    users = db.query(auth_models.User).options(
        load_only(
            auth_models.User.id,
            auth_models.User.email,
            auth_models.User.full_name,
        )
    ).all()

    # auth_models.User does not have a `role` field. Admin UI expects a `role`.
    # Provide a default role value to satisfy the response schema.
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": "customer",
        })

    return result

@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin),
):
    """
    Create a new user.
    """
    existing = db.query(auth_models.User).filter(
        (auth_models.User.email == payload.email) | (auth_models.User.phone == payload.phone)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or phone already exists")
    
    hashed_password = auth_utils.get_password_hash(payload.password)
    user = auth_models.User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin),
):
    """
    Update a user. Role checks removed.
    """
    user = db.query(auth_models.User).filter(auth_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    for field, value in payload.dict(exclude_unset=True).items():
        if field == "password" and value:
            setattr(user, "hashed_password", auth_utils.get_password_hash(value))
        else:
            # skip role if present
            if field == "role":
                continue
            setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin),
):
    """
    Delete a user. Cannot delete yourself.
    """
    user = db.query(auth_models.User).filter(auth_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/orders", response_model=list[AdminOrderOut])
def list_orders(
    status: str = None,  # Optional filter by order status
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_utils.get_current_admin),
):
    """
    List orders — only load fields required by the admin UI to avoid fetching everything.
    """
    query = db.query(sell_models.Order).options(
        load_only(
            sell_models.Order.id,
            sell_models.Order.phone_name,
            sell_models.Order.customer_name,
            sell_models.Order.agent_name,
            sell_models.Order.status,
            sell_models.Order.quoted_price,
            sell_models.Order.created_at,
        )
    )
    if status:
        query = query.filter(sell_models.Order.status == status)
    return query.order_by(sell_models.Order.created_at.desc()).all()
