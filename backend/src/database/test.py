from typing import List
from sqlalchemy import Boolean, Column, ForeignKey, Integer, PrimaryKeyConstraint, and_, insert, not_, update
from sqlalchemy import String, Table, create_engine, delete, select, exists
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.orm import DeclarativeBase, Session

from src.database.models import Chain, Courier, MenuItem, Order, OrderItem, Restaurant, User

DB_URL = f"sqlite:///./local.db"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
sessionFactory = sessionmaker(autoflush=False, bind=engine)

s = sessionFactory()

rows = s.execute(select(Order)\
				.join(Courier)\
				.join(User)\
				.where(and_(User.email == "user_1@vega.com",
						 Order.delivered_at == None)))
	
rows = s.execute(select(Courier))

for d in rows.scalars().all():
	print(f"{d.user.email} -> {d.restaurant.name}")
