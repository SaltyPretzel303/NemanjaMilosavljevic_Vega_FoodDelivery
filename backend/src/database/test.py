from typing import List
from sqlalchemy import Boolean, Column, ForeignKey, Integer, PrimaryKeyConstraint, and_, func, insert, not_, update
from sqlalchemy import String, Table, create_engine, delete, select, exists
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.orm import DeclarativeBase, Session

from src.database.models import Chain, Courier, FoodReview, MenuItem, Order, OrderItem, Restaurant, User

DB_URL = f"sqlite:///./local.db"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
sessionFactory = sessionmaker(autoflush=False, bind=engine)

s = sessionFactory()

s.execute(delete(Order))
s.execute(delete(OrderItem))

s.commit()
