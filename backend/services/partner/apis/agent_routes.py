from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.shared.db.connections import get_db
from backend.services.partner.schema import schemas as partner_schemas
from backend.services.partner.schema.models import Agent
from backend.services.partner import utils as partner_utils
from backend.services.auth import utils as auth_utils
from backend.services.sell_phone.schema.models import Order
from backend.services.sell_phone.utils import create_status_history
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/agent", tags=["Agent"])


# ================================
# AGENT AUTHENTICATION
# ================================

@router.post("/login", response_model=partner_schemas.AgentToken)
def agent_login(
    payload: partner_schemas.AgentLogin,
    db: Session = Depends(get_db),
):
    """
    Agent login endpoint.
    """
    try:
        agent = partner_utils.authenticate_agent(db, payload.email, payload.password)
        token = partner_utils.create_agent_token(agent)
        
        return partner_schemas.AgentToken(
            access_token=token,
            agent=partner_schemas.AgentOut.from_orm(agent)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=partner_schemas.AgentNameOut)
def get_current_agent_profile(
    current_agent: Agent = Depends(auth_utils.get_current_agent),
):
    """
    Get current agent's profile.
    """
    return partner_schemas.AgentNameOut(full_name=current_agent.full_name)


# ================================
# AGENT ORDER MANAGEMENT
# ================================

@router.get("/orders", response_model=List[dict])
def get_agent_orders(
    status_filter: str = Query(None, description="Filter by order status"),
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(auth_utils.get_current_agent),
):
    """
    Get all orders assigned to the current agent.
    """
    orders = partner_utils.get_agent_orders(
        db=db,
        agent_id=current_agent.id,
        status_filter=status_filter
    )
    
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "phone_name": order.phone_name,
            "brand": order.brand,
            "model": order.model,
            "specs": f"{int(order.ram_gb)}GB RAM • {int(order.storage_gb)}GB Storage",
            "status": "pickup completed" if order.status == "pickup_completed" else order.status,
            "estimated_value": order.ai_estimated_price,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "pickup_address_line": order.pickup_address_line,
            "pickup_city": order.pickup_city,
            "pickup_state": order.pickup_state,
            "pickup_pincode": order.pickup_pincode,
            "pickup_date": order.pickup_date.strftime('%d/%m/%Y') if order.pickup_date else None,
            "pickup_time": order.pickup_time,
            "payment_method": order.payment_method,
            "ram_gb": order.ram_gb,
            "storage_gb": order.storage_gb,
            "ai_estimated_price": order.ai_estimated_price,
            "final_quoted_price": order.final_quoted_price,
            "status_detail": "pickup completed" if order.status == "pickup_completed" else order.status,
        })
    
    return result


@router.get("/orders/{order_id}", response_model=dict)
def get_agent_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(auth_utils.get_current_agent),
):
    """
    Get detailed information about a specific order.
    """
    order = partner_utils.validate_agent_order_access(db, current_agent.id, order_id)
    return {
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
        "pickup_date": order.pickup_date.strftime('%d/%m/%Y') if order.pickup_date else None,
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
    }


@router.post("/orders/{order_id}/schedule-pickup", status_code=200)
def schedule_pickup(
    order_id: int,
    payload: partner_schemas.SchedulePickupRequest,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(auth_utils.get_current_agent),
):
    """
    Schedule pickup for an assigned order.
    When partner assigns an order to agent, agent must complete the order.
    No accept/reject allowed - agent directly schedules pickup.
    """
    order = partner_utils.validate_agent_order_access(db, current_agent.id, order_id)
    
    # Validate order status - agent can schedule from assigned_to_agent status
    if order.status not in ["assigned_to_agent", "accepted_by_agent"]:
        raise HTTPException(
            status_code=400,
            detail=f"Can only schedule pickup for assigned orders (current status: {order.status})"
        )
    
    # Update order status to accepted (auto-accept) and schedule pickup
    old_status = order.status
    order.status = "pickup_scheduled"
    order.pickup_date = payload.scheduled_date
    order.pickup_time = payload.scheduled_time
    
    # Set accepted_at if not already set
    if not order.accepted_at:
        order.accepted_at = datetime.utcnow()
    
    # Create status history - directly from assigned_to_agent to pickup_scheduled
    notes = f"Order auto-accepted and pickup scheduled for {payload.scheduled_date} at {payload.scheduled_time}"
    if payload.notes:
        notes += f" - Notes: {payload.notes}"
    
    create_status_history(
        db=db,
        order_id=order_id,
        from_status=old_status,
        to_status="pickup_scheduled",
        changed_by_user_type="agent",
        changed_by_user_id=current_agent.id,
        notes=notes
    )
    
    db.commit()
    
    return {
        "message": "Pickup scheduled successfully",
        "order_id": order_id,
        "pickup_date": payload.scheduled_date,
        "pickup_time": payload.scheduled_time
    }


@router.post("/orders/{order_id}/complete-pickup", status_code=200)
def complete_pickup(
    order_id: int,
    payload: Optional[partner_schemas.CompletePickupRequest] = None,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(auth_utils.get_current_agent),
):
    """
    Complete the pickup process.
    Records actual condition, final price, and customer acceptance.
    """
    order = partner_utils.validate_agent_order_access(db, current_agent.id, order_id)
    
    if not payload:
        raise HTTPException(
            status_code=400,
            detail="Request body required with actual_condition, final_offered_price, customer_accepted"
        )
    
    # Validate order status
    if order.status != "pickup_scheduled":
        raise HTTPException(
            status_code=400,
            detail=f"Can only complete scheduled pickups (current status: {order.status})"
        )
    
    # Update order with pickup completion details
    order.actual_condition = payload.actual_condition
    order.final_offered_price = payload.final_offered_price
    order.customer_accepted_offer = payload.customer_accepted
    order.pickup_notes = payload.pickup_notes
    order.completed_at = datetime.utcnow()
    
    if payload.payment_method:
        order.payment_method = payload.payment_method
    
    # Determine next status based on customer acceptance
    if payload.customer_accepted:
        order.status = "pickup_completed"
        new_status = "pickup_completed"
        notes = f"Pickup completed. Customer accepted offer of ₹{payload.final_offered_price}"
    else:
        order.status = "pickup_completed_declined"
        new_status = "pickup_completed_declined"
        notes = f"Pickup completed. Customer declined offer of ₹{payload.final_offered_price}"
    
    if payload.pickup_notes:
        notes += f" - Notes: {payload.pickup_notes}"
    
    # Create status history
    create_status_history(
        db=db,
        order_id=order_id,
        from_status="pickup_scheduled",
        to_status=new_status,
        changed_by_user_type="agent",
        changed_by_user_id=current_agent.id,
        notes=notes
    )
    
    db.commit()
    
    return {
        "message": "Pickup completed successfully",
        "order_id": order_id,
        "status": order.status,
        "customer_accepted": payload.customer_accepted
    }


@router.post("/orders/{order_id}/process-payment", status_code=200)
def process_payment(
    order_id: int,
    payload: partner_schemas.ProcessPaymentRequest,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(auth_utils.get_current_agent),
):
    """
    Process payment for a completed pickup.
    Only available if customer accepted the offer.
    """
    order = partner_utils.validate_agent_order_access(db, current_agent.id, order_id)
    
    # Validate order status
    if order.status != "pickup_completed":
        raise HTTPException(
            status_code=400,
            detail=f"Can only process payment for completed pickups (current status: {order.status})"
        )
    
    if not order.customer_accepted_offer:
        raise HTTPException(
            status_code=400,
            detail="Cannot process payment - customer declined the offer"
        )
    
    # Update order with payment details
    order.payment_amount = payload.payment_amount
    order.payment_method = payload.payment_method
    order.payment_transaction_id = payload.transaction_id
    order.payment_notes = payload.payment_notes
    order.payment_processed_at = datetime.utcnow()
    order.status = "payment_processed"
    
    # Create status history
    notes = f"Payment of ₹{payload.payment_amount} processed via {payload.payment_method}"
    if payload.transaction_id:
        notes += f" (Transaction ID: {payload.transaction_id})"
    if payload.payment_notes:
        notes += f" - Notes: {payload.payment_notes}"
    
    create_status_history(
        db=db,
        order_id=order_id,
        from_status="pickup_completed",
        to_status="payment_processed",
        changed_by_user_type="agent",
        changed_by_user_id=current_agent.id,
        notes=notes
    )
    
    db.commit()
    
    return {
        "message": "Payment processed successfully",
        "order_id": order_id,
        "payment_amount": payload.payment_amount,
        "payment_method": payload.payment_method,
        "status": order.status
    }
