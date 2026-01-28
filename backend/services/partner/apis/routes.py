from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.shared.db.connections import get_db
from backend.services.partner.schema import schemas as partner_schemas
from backend.services.partner.schema.models import Agent, Partner
from backend.services.partner import utils as partner_utils
from backend.services.auth import utils as auth_utils
from backend.services.sell_phone.schema.models import Order
from backend.services.sell_phone.utils import create_status_history
from typing import List
from datetime import datetime, timezone
from backend.services.admin.schema.models import CreditPlan, PartnerCreditTransaction
from backend.services.admin import schema as admin_schemas

router = APIRouter(prefix="/partner", tags=["Partner"])


# ------------------------------
# Credit purchase endpoints for partners
# ------------------------------


@router.get("/credit-plans", response_model=List[dict])
def partner_get_credit_plans(db: Session = Depends(get_db)):
    """List active credit plans for partners."""
    plans = db.query(CreditPlan).filter(CreditPlan.is_active == True).order_by(CreditPlan.credit_amount).all()
    result = []
    for p in plans:
        result.append({
            "id": p.id,
            "plan_name": p.plan_name,
            "credit_amount": p.credit_amount,
            "price": p.price,
            "bonus_percentage": p.bonus_percentage,
            "description": p.description,
            "is_active": p.is_active,
        })
    return result


@router.post("/purchase-credits", response_model=dict)
def partner_purchase_credits(
    payload: dict,
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """Allow partner to purchase a credit plan (simulated/offline).

    Body: { "plan_id": int, "payment_method": str, "payment_transaction_id": Optional[str] }
    """
    plan_id = payload.get("plan_id")
    payment_method = payload.get("payment_method", "manual")
    payment_transaction_id = payload.get("payment_transaction_id")

    if not plan_id:
        raise HTTPException(status_code=400, detail="plan_id is required")

    plan = db.query(CreditPlan).filter(CreditPlan.id == plan_id, CreditPlan.is_active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Credit plan not found")

    balance_before = current_partner.credit_balance
    bonus = (plan.credit_amount * (plan.bonus_percentage or 0.0)) / 100.0
    credit_added = plan.credit_amount + bonus
    current_partner.credit_balance = (current_partner.credit_balance or 0.0) + credit_added
    balance_after = current_partner.credit_balance

    transaction = PartnerCreditTransaction(
        partner_id=current_partner.id,
        transaction_type="credit_purchase",
        amount=credit_added,
        balance_before=balance_before,
        balance_after=balance_after,
        reference_id=plan.id,
        reference_type="credit_plan",
        payment_method=payment_method,
        payment_transaction_id=payment_transaction_id,
        notes=f"Purchased plan {plan.plan_name}",
    )

    db.add(current_partner)
    db.add(transaction)
    db.commit()

    return {
        "message": "Credits purchased successfully",
        "credit_added": credit_added,
        "balance_before": balance_before,
        "balance_after": balance_after,
        "plan": {"id": plan.id, "plan_name": plan.plan_name, "credit_amount": plan.credit_amount},
    }


# ================================
# PARTNER AUTH ENDPOINTS
# ================================

@router.post("/signup", response_model=partner_schemas.PartnerToken, status_code=201)
def partner_signup(
    payload: partner_schemas.PartnerApplicationCreate,
    db: Session = Depends(get_db),
):
    """
    Partner application (signup).
    Creates partner account with 'pending' verification status.
    Admin must approve before partner can access leads.
    """
    try:
        partner = partner_utils.create_partner_application(
            db=db,
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password=payload.password,
            company_name=payload.company_name,
            business_address=payload.business_address,
            gst_number=payload.gst_number,
            pan_number=payload.pan_number,
            serviceable_pincodes=payload.serviceable_pincodes
        )
        db.commit()
        db.refresh(partner)
        
        # Generate token
        access_token = partner_utils.create_partner_token(partner)
        
        return partner_schemas.PartnerToken(
            access_token=access_token,
            token_type="bearer",
            partner=partner
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=partner_schemas.PartnerToken)
def partner_login(
    payload: partner_schemas.PartnerLogin,
    db: Session = Depends(get_db),
):
    """
    Partner login.
    Returns JWT token for authentication.
    """
    try:
        partner = partner_utils.authenticate_partner(
            db=db,
            email=payload.email,
            password=payload.password
        )
        
        # Generate token
        access_token = partner_utils.create_partner_token(partner)
        
        return partner_schemas.PartnerToken(
            access_token=access_token,
            token_type="bearer",
            partner=partner
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )


@router.get("/me", response_model=partner_schemas.PartnerCreditNameOut)
def get_partner_profile(
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Get current partner profile.
    Requires authentication.
    """
    return partner_schemas.PartnerCreditNameOut(
        full_name=current_partner.full_name,
        credit_balance=current_partner.credit_balance
    )


# ================================
# AGENT MANAGEMENT ENDPOINTS (FOR PARTNERS)
# ================================

@router.post("/agents", response_model=partner_schemas.AgentOut, status_code=201)
def create_agent(
    payload: partner_schemas.AgentCreate,
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Create a new agent for the current partner.
    """
    try:
        agent = partner_utils.create_agent(
            db=db,
            partner_id=current_partner.id,
            email=payload.email,
            phone=payload.phone,
            password=payload.password,
            full_name=payload.full_name,
            employee_id=payload.employee_id
        )
        db.commit()
        db.refresh(agent)
        return agent
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/agents", response_model=List[partner_schemas.AgentOut])
def list_agents(
    is_active: bool = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    List all agents for the current partner.
    """
    query = db.query(Agent).filter(Agent.partner_id == current_partner.id)
    
    if is_active is not None:
        query = query.filter(Agent.is_active == is_active)
    
    agents = query.order_by(Agent.created_at.desc()).all()
    return agents


@router.get("/agents/{agent_id}", response_model=partner_schemas.AgentOut)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Get details of a specific agent.
    """
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.partner_id == current_partner.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent


@router.patch("/agents/{agent_id}", response_model=partner_schemas.AgentOut)
def update_agent(
    agent_id: int,
    payload: partner_schemas.AgentUpdate,
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Update agent details.
    """
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.partner_id == current_partner.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update fields
    if payload.phone is not None:
        agent.phone = payload.phone
    if payload.full_name is not None:
        agent.full_name = payload.full_name
    if payload.employee_id is not None:
        agent.employee_id = payload.employee_id
    if payload.is_active is not None:
        agent.is_active = payload.is_active
    
    agent.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/agents/{agent_id}", status_code=200)
def deactivate_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Deactivate an agent (soft delete).
    """
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.partner_id == current_partner.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.is_active = False
    agent.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Agent deactivated successfully", "agent_id": agent_id}


# ================================
# ORDER ASSIGNMENT ENDPOINTS (FOR PARTNERS)
# ================================

@router.get("/locked-deals", response_model=List[dict])
def get_locked_deals(
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Get all deals locked by the current partner (status = lead_locked).
    """
    from backend.services.sell_phone.utils import calculate_lead_cost, expire_all_expired_locks

    # Expire any locks that have passed their expiry before returning locked deals
    expire_all_expired_locks(db)
    
    orders = db.query(Order).filter(
        Order.partner_id == current_partner.id,
        Order.status == "lead_locked"
    ).order_by(Order.lead_locked_at.desc()).all()
    
    result = []
    for order in orders:
        lead_cost = calculate_lead_cost(db, order.final_quoted_price or order.quoted_price)
        result.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "partner_id": order.partner_id,
            "agent_id": order.agent_id,
            "phone_name": order.phone_name,
            "brand": order.brand,
            "model": order.model,
            "ram_gb": order.ram_gb,
            "storage_gb": order.storage_gb,
            "variant": order.variant,
            "ai_estimated_price": order.ai_estimated_price,
            "ai_reasoning": order.ai_reasoning,
            "customer_condition_answers": order.customer_condition_answers,
            "final_quoted_price": order.final_quoted_price,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "customer_email": order.customer_email,
            "pickup_address_line": order.pickup_address_line,
            "pickup_city": order.pickup_city,
            "pickup_state": order.pickup_state,
            "pickup_pincode": order.pickup_pincode,
            "pickup_date": order.pickup_date,
            "pickup_time": order.pickup_time,
            "payment_method": order.payment_method,
            "status": order.status,
            "lead_locked_at": order.lead_locked_at,
            "lead_lock_expires_at": order.lead_lock_expires_at,
            "purchased_at": order.purchased_at,
            "assigned_at": order.assigned_at,
            "accepted_at": order.accepted_at,
            "completed_at": order.completed_at,
            "cancelled_at": order.cancelled_at,
            "cancellation_reason": order.cancellation_reason,
            "actual_condition": order.actual_condition,
            "final_offered_price": order.final_offered_price,
            "customer_accepted_offer": order.customer_accepted_offer,
            "pickup_notes": order.pickup_notes,
            "payment_amount": order.payment_amount,
            "payment_transaction_id": order.payment_transaction_id,
            "payment_notes": order.payment_notes,
            "payment_processed_at": order.payment_processed_at,
            "user_id": order.user_id,
            "condition": order.condition,
            "quoted_price": order.quoted_price,
            "phone_number": order.phone_number,
            "email": order.email,
            "address_line": order.address_line,
            "city": order.city,
            "state": order.state,
            "pincode": order.pincode,
            "agent_name": order.agent_name,
            "agent_phone": order.agent_phone,
            "agent_email": order.agent_email,
            "created_at": order.created_at,
            "lead_cost": lead_cost,
            "time_remaining": None if not order.lead_lock_expires_at else 
                (order.lead_lock_expires_at - datetime.now(timezone.utc)).total_seconds()
        })
    
    return result


@router.get("/lead-purchase-info/{order_id}", response_model=dict)
def get_lead_purchase_info(
    order_id: int,
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Get credit balance and lead cost calculation for a locked lead before purchasing.
    """
    from backend.services.sell_phone.utils import calculate_lead_cost
    from backend.services.sell_phone.utils import expire_all_expired_locks

    # Ensure lock is still active and expire others if needed
    expire_all_expired_locks(db)
    
    # Verify the partner has an active lock on this order
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.partner_id == current_partner.id,
        Order.status == "lead_locked"
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Locked lead not found or not owned by you"
        )
    
    lead_cost = calculate_lead_cost(db, order.final_quoted_price or order.quoted_price)
    current_balance = current_partner.credit_balance or 0.0
    balance_after = current_balance - lead_cost
    has_sufficient_credits = current_balance >= lead_cost
    
    return {
        "order_id": order_id,
        "phone_name": order.phone_name,
        "brand": order.brand,
        "model": order.model,
        "ai_estimated_price": order.ai_estimated_price,
        "final_quoted_price": order.final_quoted_price,
        "lead_cost": lead_cost,
        "current_balance": current_balance,
        "balance_after": balance_after,
        "has_sufficient_credits": has_sufficient_credits,
        "shortage_amount": max(0, lead_cost - current_balance)
    }


@router.get("/orders", response_model=List[partner_schemas.PartnerOrderBriefOut])
def get_partner_orders(
    status_filter: str = Query(None, description="Filter by order status"),
    assigned_filter: str = Query(None, description="'assigned', 'unassigned', or None for all"),
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Get all orders purchased by the current partner.
    """
    from backend.services.sell_phone.utils import expire_all_expired_locks

    # Expire any locks that have passed their expiry before returning orders
    expire_all_expired_locks(db)

    query = db.query(Order).filter(Order.partner_id == current_partner.id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    if assigned_filter == "assigned":
        query = query.filter(Order.agent_id.isnot(None))
    elif assigned_filter == "unassigned":
        query = query.filter(Order.agent_id.is_(None))
    
    orders = query.order_by(Order.purchased_at.desc()).all()
    
    # Return only the compact fields required by the partner orders list UI
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "phone_name": order.phone_name,
            "ram_gb": order.ram_gb,
            "storage_gb": order.storage_gb,
            "status": order.status,
            "ai_estimated_price": order.ai_estimated_price,
            "final_quoted_price": order.final_quoted_price,
            "ai_reasoning": order.ai_reasoning,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "customer_email": order.customer_email,
            "pickup_address_line": order.pickup_address_line,
            "pickup_city": order.pickup_city,
            "pickup_state": order.pickup_state,
            "pickup_pincode": order.pickup_pincode,
            "agent_name": order.agent_name,
            "agent_id": order.agent_id,
            "customer_condition_answers": order.customer_condition_answers,
            "created_at": order.created_at,
        })
    
    return result


@router.post("/orders/{order_id}/assign", status_code=200)
def assign_order_to_agent(
    order_id: int,
    agent_id: int = Query(..., description="ID of the agent to assign"),
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Assign a purchased order to an agent.
    """
    # Validate partner owns this order
    order = partner_utils.validate_partner_order_access(db, current_partner.id, order_id)
    
    # Validate agent belongs to this partner
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.partner_id == current_partner.id,
        Agent.is_active == True
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found or not active"
        )
    
    # Validate order status
    if order.status != "lead_purchased":
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be assigned (current status: {order.status})"
        )
    
    # Assign agent
    order.agent_id = agent_id
    order.agent_name = agent.full_name
    order.agent_phone = agent.phone
    order.agent_email = agent.email
    order.status = "accepted_by_agent"
    order.assigned_at = datetime.utcnow()
    order.accepted_at = datetime.utcnow()
    
    # Create status history
    create_status_history(
        db=db,
        order_id=order_id,
        from_status="lead_purchased",
        to_status="accepted_by_agent",
        changed_by_user_type="partner",
        changed_by_user_id=current_partner.id,
        notes=f"Assigned to agent {agent.full_name} (ID: {agent_id})"
    )
    
    db.commit()
    
    return {
        "message": "Order assigned successfully",
        "order_id": order_id,
        "agent_id": agent_id,
        "agent_name": agent.full_name,
        "agent_phone": agent.phone,
        "agent_email": agent.email
    }


@router.post("/orders/{order_id}/reassign", status_code=200)
def reassign_order_to_agent(
    order_id: int,
    new_agent_id: int = Query(..., description="ID of the new agent"),
    db: Session = Depends(get_db),
    current_partner: Partner = Depends(auth_utils.get_current_partner),
):
    """
    Reassign an order to a different agent.
    """
    # Validate partner owns this order
    order = partner_utils.validate_partner_order_access(db, current_partner.id, order_id)
    
    # Validate new agent
    new_agent = db.query(Agent).filter(
        Agent.id == new_agent_id,
        Agent.partner_id == current_partner.id,
        Agent.is_active == True
    ).first()
    
    if not new_agent:
        raise HTTPException(status_code=404, detail="New agent not found or not active")
    
    # Validate order can be reassigned
    valid_statuses = ["assigned_to_agent", "accepted_by_agent"]
    if order.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be reassigned (current status: {order.status})"
        )
    
    old_agent_id = order.agent_id
    old_status = order.status
    
    # Reassign
    order.agent_id = new_agent_id
    order.agent_name = new_agent.full_name
    order.agent_phone = new_agent.phone
    order.agent_email = new_agent.email
    order.status = "assigned_to_agent"  # Reset to assigned status
    order.assigned_at = datetime.utcnow()
    order.accepted_at = None  # Clear acceptance timestamp
    
    # Create status history
    create_status_history(
        db=db,
        order_id=order_id,
        from_status=old_status,
        to_status="assigned_to_agent",
        changed_by_user_type="partner",
        changed_by_user_id=current_partner.id,
        notes=f"Reassigned from agent {old_agent_id} to agent {new_agent.full_name} (ID: {new_agent_id})"
    )
    
    db.commit()
    
    return {
        "message": "Order reassigned successfully",
        "order_id": order_id,
        "new_agent_id": new_agent_id,
        "new_agent_name": new_agent.full_name,
        "new_agent_phone": new_agent.phone,
        "new_agent_email": new_agent.email
    }
