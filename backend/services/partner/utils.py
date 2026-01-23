from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from datetime import datetime
from services.partner.schema.models import Agent, Partner, PartnerServiceablePincode
from services.auth.utils import get_password_hash, verify_password, create_access_token
from services.sell_phone.schema.models import Order
from typing import List


# ================================
# PARTNER UTILITIES
# ================================

def create_partner_application(
    db: Session,
    full_name: str,
    email: str,
    phone: str,
    password: str,
    company_name: str,
    business_address: str,
    gst_number: str,
    pan_number: str,
    serviceable_pincodes: List[str]
) -> Partner:
    """
    Create a new partner application (signup).
    Partner starts with 'pending' verification status.
    
    Args:
        db: Database session
        full_name: Partner's full name
        email: Partner email (must be unique)
        phone: Partner phone number
        password: Plain text password (will be hashed)
        company_name: Company/business name
        business_address: Business address
        gst_number: GST number (optional)
        pan_number: PAN number
        serviceable_pincodes: List of pincodes partner can service
        
    Returns:
        Created Partner object
        
    Raises:
        ValueError: If email already exists
    """
    # Check if email already exists
    existing = db.query(Partner).filter(Partner.email == email).first()
    if existing:
        raise ValueError(f"Partner with email {email} already exists")
    
    # Hash password
    hashed_password = get_password_hash(password)
    
    # Create partner
    partner = Partner(
        email=email,
        full_name=full_name,
        phone=phone,
        hashed_password=hashed_password,
        company_name=company_name,
        business_address=business_address,
        gst_number=gst_number if gst_number else None,
        pan_number=pan_number,
        verification_status='pending',
        credit_balance=0.0,
        is_active=True
    )
    
    db.add(partner)
    db.flush()
    
    # Add serviceable pincodes
    for pincode in serviceable_pincodes:
        serviceable = PartnerServiceablePincode(
            partner_id=partner.id,
            pincode=pincode,
            is_active=True
        )
        db.add(serviceable)
    
    db.flush()
    
    return partner


def authenticate_partner(db: Session, email: str, password: str) -> Partner:
    """
    Authenticate a partner by email and password.
    
    Args:
        db: Database session
        email: Partner email
        password: Plain text password
        
    Returns:
        Authenticated Partner object
        
    Raises:
        ValueError: If credentials are invalid
    """
    partner = db.query(Partner).filter(Partner.email == email).first()
    
    if not partner:
        raise ValueError("Invalid credentials")
    
    if not verify_password(password, partner.hashed_password):
        raise ValueError("Invalid credentials")
    
    if not partner.is_active:
        raise ValueError("Partner account is deactivated")
    
    # Allow login but warn if not approved
    # The get_current_partner dependency will block API access for non-approved partners
    
    return partner


def create_partner_token(partner: Partner) -> str:
    """
    Create JWT token for partner authentication.
    
    Args:
        partner: Partner object
        
    Returns:
        JWT access token
    """
    token_data = {
        "partner_id": partner.id,
        "email": partner.email,
        "verification_status": partner.verification_status
    }
    return create_access_token(data=token_data)


# ================================
# AGENT UTILITIES
# ================================


def create_agent(
    db: Session,
    partner_id: int,
    email: str,
    phone: str,
    password: str,
    full_name: str,
    employee_id: str = None
) -> Agent:
    """
    Create a new agent for a partner.
    
    Args:
        db: Database session
        partner_id: ID of the partner who owns this agent
        email: Agent email (must be unique)
        phone: Agent phone number
        password: Plain text password (will be hashed)
        full_name: Agent's full name
        employee_id: Optional employee ID
        
    Returns:
        Created Agent object
        
    Raises:
        ValueError: If email already exists
    """
    # Check if email already exists
    existing = db.query(Agent).filter(Agent.email == email).first()
    if existing:
        raise ValueError(f"Agent with email {email} already exists")
    
    # Hash password
    hashed_password = get_password_hash(password)
    
    # Create agent
    agent = Agent(
        partner_id=partner_id,
        email=email,
        phone=phone,
        hashed_password=hashed_password,
        full_name=full_name,
        employee_id=employee_id,
        is_active=True
    )
    
    db.add(agent)
    db.flush()
    
    return agent


def authenticate_agent(db: Session, email: str, password: str) -> Agent:
    """
    Authenticate an agent by email and password.
    
    Args:
        db: Database session
        email: Agent email
        password: Plain text password
        
    Returns:
        Authenticated Agent object
        
    Raises:
        ValueError: If credentials are invalid
    """
    agent = db.query(Agent).filter(Agent.email == email).first()
    
    if not agent:
        raise ValueError("Invalid credentials")
    
    if not verify_password(password, agent.hashed_password):
        raise ValueError("Invalid credentials")
    
    if not agent.is_active:
        raise ValueError("Agent account is deactivated")
    
    return agent


def create_agent_token(agent: Agent) -> str:
    """
    Create JWT token for agent authentication.
    
    Args:
        agent: Agent object
        
    Returns:
        JWT access token
    """
    token_data = {
        "agent_id": agent.id,
        "partner_id": agent.partner_id,
        "email": agent.email
    }
    return create_access_token(data=token_data)


def get_agent_orders(
    db: Session,
    agent_id: int,
    status_filter: str = None
) -> list:
    """
    Get orders assigned to an agent.
    
    Args:
        db: Database session
        agent_id: ID of the agent
        status_filter: Optional status filter (e.g., 'assigned_to_agent', 'accepted_by_agent')
        
    Returns:
        List of Order objects
    """
    query = db.query(Order).filter(Order.agent_id == agent_id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    return query.order_by(Order.assigned_at.desc()).all()


def validate_agent_order_access(
    db: Session,
    agent_id: int,
    order_id: int
) -> Order:
    """
    Validate that an agent has access to an order.
    
    Args:
        db: Database session
        agent_id: ID of the agent
        order_id: ID of the order
        
    Returns:
        Order object if valid
        
    Raises:
        HTTPException: If order not found or not assigned to agent
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.agent_id != agent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This order is not assigned to you"
        )
    
    return order


def validate_partner_order_access(
    db: Session,
    partner_id: int,
    order_id: int
) -> Order:
    """
    Validate that a partner has access to an order.
    
    Args:
        db: Database session
        partner_id: ID of the partner
        order_id: ID of the order
        
    Returns:
        Order object if valid
        
    Raises:
        HTTPException: If order not found or not owned by partner
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.partner_id != partner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This order does not belong to your partnership"
        )
    
    return order
