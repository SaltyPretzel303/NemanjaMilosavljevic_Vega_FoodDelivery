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

chain = '2x2'
item = 'Bolgonese'
user = "nemanja@vega.com"

stm = select(func.avg(FoodReview.rating))\
			.join(MenuItem).join(Chain)\
			.where(and_(Chain.name == chain, MenuItem.name == item))

data = s.execute(stm)
print(data.scalar())

# row = s.execute(stm)
# val = row.scalar()
# print(val)

# rows = s.execute(select(FoodReview))

# for r in rows.scalars().all():
# 	print(r.rating)