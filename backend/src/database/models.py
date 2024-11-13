from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, PrimaryKeyConstraint, String, Table
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import relationship

class Base(DeclarativeBase): 
	pass


class User(Base): 
	__tablename__ = 'users'

	id = Column(Integer, primary_key=True, index= True)

	email = Column(String, unique=True)
	address = Column(String)
	tokens_id = Column(String)
	long = Column(Float)
	lat = Column(Float)

class Chain(Base): 
	__tablename__ = 'chains'

	id = Column(Integer, primary_key=True, index= True)
	name = Column(String, unique=True)

	description = Column(String)
	
class Restaurant(Base): 
	__tablename__ = 'restaurants'

	id = Column(Integer, primary_key=True, index= True)
	chain_id = Column(ForeignKey(Chain.id), nullable=False)
	chain = relationship(Chain, uselist=False, lazy='immediate')
	name = Column(String, unique=True)
	address = Column(String)
	lat = Column(Float)
	long = Column(Float)

class Courier(Base): 
	__tablename__ = 'couriers'

	id = Column(Integer, primary_key=True, index=True)

	user_id = Column(ForeignKey(User.id))
	user = relationship(User, uselist=False, lazy='immediate')

	# Current location ... currently not used.
	lat = Column(Float)
	long = Column(Float)

	restaurant_id = Column(ForeignKey(Restaurant.id))
	restaurant = relationship(Restaurant, uselist=False, lazy='immediate')

class MenuItem(Base): 
	__tablename__ = 'menuitems'

	id = Column(Integer, primary_key=True, index= True)
	name = Column(String)
	description = Column(String)
	price = Column(Float)
	currency = Column(String)
	imgUrl = Column(String)

	chain_id = Column(ForeignKey(Chain.id))

class Order(Base): 
	__tablename__ = 'orders'

	id = Column(Integer, primary_key=True, index=True)

	user_id = Column(ForeignKey("users.id"))

	restaurant_id = Column(ForeignKey(Restaurant.id))
	restaurant = relationship(Restaurant, uselist=False, lazy="immediate")
	courier_id = Column(ForeignKey(Courier.id))
	courier = relationship(Courier, uselist=False, lazy="immediate")

	created_at = Column(DateTime)
	delivered_at = Column(DateTime, nullable=True)

class OrderItem(Base): 
	__tablename__ = "order_items"

	id = Column(Integer, primary_key=True, index=True)
	order_id = Column(ForeignKey(Order.id))
	item_id = Column(ForeignKey(MenuItem.id))
	price = Column(Float)
	currency = Column(String)

class Role(Base):
	__tablename__ = 'roles'

	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(ForeignKey(User.id))
	user = relationship(User, uselist=False, lazy="immediate")

	chain_id = Column(ForeignKey(Chain.id))
	chain = relationship(Chain, uselist=False, lazy="immediate")

	role_name = Column(String)
	
class FoodReview(Base): 
	__tablename__ = "food_reviews"

	id = Column(Integer, primary_key=True, index=True)

	item_id = Column(ForeignKey(MenuItem.id))
	user_id = Column(ForeignKey(User.id))
	user = relationship(User, uselist=False, lazy="immediate")

	rating = Column(Float)
	comment = Column(String)
