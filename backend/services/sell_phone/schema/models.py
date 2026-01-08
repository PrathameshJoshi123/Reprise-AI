from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from shared.db.connections import Base, engine  # Assuming Base is defined in shared/db/connections.py

class PhoneList(Base):
    __tablename__ = "phones_list"

    id = Column(Integer, primary_key=True, index=True)
    Brand = Column(String, nullable=False)
    Series = Column(String, nullable=False)
    Model = Column(String, nullable=False)
    Storage_Raw = Column(String, nullable=False)  # Assuming string for raw storage info
    Original_Price = Column(Float, nullable=True)
    Selling_Price = Column(Float, nullable=False)
    RAM_GB = Column(Float, nullable=True)
    Internal_Storage_GB = Column(Float, nullable=False)

# New: Order model to persist sale with agent fields
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # buyer / customer
    phone_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    ram_gb = Column(Float, nullable=True)
    storage_gb = Column(Float, nullable=True)
    variant = Column(String, nullable=True)
    condition = Column(String, nullable=True)
    quoted_price = Column(Float, nullable=False, default=0.0)

    # Customer / pickup details
    customer_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address_line = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    pickup_date = Column(DateTime(timezone=True), nullable=True)
    pickup_time = Column(String, nullable=True)

    # New: pickup geolocation
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)

    payment_method = Column(String, nullable=True)

    # Agent acceptance info
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent_name = Column(String, nullable=True)
    agent_phone = Column(String, nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    # order lifecycle
    status = Column(String, nullable=False, default="pending")  # pending | accepted | completed | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ensure tables exist (creates orders table as well)
Base.metadata.create_all(bind=engine)
