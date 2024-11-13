from datetime import datetime, UTC
import math
from sqlite3 import IntegrityError
from typing import List

from sqlalchemy import and_, exists, func, select, delete, update
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import FoodReview, OrderItem
from src.model.models import CheckoutItem, Sort
from src.database.models import Chain, Courier, Order, Restaurant, MenuItem
from src.database.models import Role, User

async def add_chain(s: AsyncSession, name: str, description:str) -> tuple[Chain, str]:
	res = await s.execute(
		insert(Chain)\
		.values(
			name=name,
			description=description
		).on_conflict_do_nothing(index_elements=[Chain.name])\
		.returning(Chain))
	
	await s.commit()

	if res == None: 
		return (None, "Such chain already exists.")
	else: 
		return (res.scalar(), None)	
	
async def get_chain(s: AsyncSession, name: str) -> Chain: 
	res = await s.execute(select(Chain).where(Chain.name == name))
	return res.scalar()

async def get_chains(s: AsyncSession, 
				sort: Sort,
				from_ind: int=0, 
				count: int=None) -> List[Chain]: 
	
	if sort != Sort.byName: 
		print("Invalid chains sort passed.")
		return []

	rows = await s.execute(select(Chain)
						.order_by(Chain.name)
						.offset(from_ind)
						.limit(count))
	
	return rows.scalars().all()

async def add_restourant(s: AsyncSession, 
				chain_name: str,
				name: str, 
				address: str, 
				long: float, 
				lat: float) -> tuple[Restaurant, str]: 
	
	chain_id_stm = select(Chain.id).where(Chain.name == chain_name).limit(1)

	insert_stm = insert(Restaurant)\
		.values(
			chain_id=chain_id_stm.scalar_subquery(),
			name=name, 
			address=address, 
			long=long, 
			lat=lat
		)\
		.on_conflict_do_nothing(index_elements=[Restaurant.name])\
		.returning(Restaurant)

	try:
		rest = await s.execute(insert_stm)
	except IntegrityError as e: 
		# Should get caught but doesn't. 
		return (None, "Chain non existant.")
	except Exception as e: 
		print(f"Unknown err: {e}")
		return (None, "Chain non existant.")

	await s.commit()

	if rest is None: 
		return (None, "Such restaurant already exists.")
	else:
		return (rest.scalar(), None)

async def update_restourant(s: AsyncSession, name: str, new_address: str) -> bool:
	stm = update(Restaurant)\
		.where(Restaurant.name == name)\
		.values(address = new_address)\
		.returning(Restaurant.id)

	row = await s.execute(stm)
	await s.commit()
	row.scalar()

	return row is not None

async def delete_restaurant(s: AsyncSession, name: str) -> bool:
	# await s.execute(delete(Order).where(Order.restaurant.name == name))
	# await s.execute(delete(Courier).where(Courier.restaurant.name == name))
	await s.execute(delete(Restaurant).where(Restaurant.name == name))
	await s.commit()

	return True

async def has_active_orders(s: AsyncSession, rest: str) -> bool: 
	stm = select(Order)\
			.join(Restaurant)\
			.where(and_(Restaurant.name == rest, 
						Order.delivered_at == None))
	
	rows = await s.execute(stm)
	
	data = rows.scalars().all()
	return len(data) != 0 

def distance(rest: Restaurant, long_b:float, lat_b:float): 
	x = math.fabs(rest.long-long_b)
	y = math.fabs(rest.lat-lat_b)
	return math.sqrt(pow(x,2) + pow(y,2))

async def get_free_courier(s: AsyncSession, chain: str, long: float, lat: float) -> Courier: 
	
	doing_delivery_stm = ~exists(select(Order)\
					.where(and_(Order.courier_id == Courier.id, 
				 			Order.delivered_at == None)))

	stm = select(Courier)\
		.join(Restaurant)\
		.join(Chain)\
		.where(and_(Chain.name == chain, doing_delivery_stm))

	rows = await s.execute(stm)
	data = rows.scalars().all()

	if len(data) == 0:
		return None
	
	with_dist = list(map(lambda row: (distance(row.restaurant, long, lat), row), data))
	
	return sorted(with_dist, key=lambda el: el[0])[0][1]

async def add_order(s: AsyncSession, 
				user_id, 
				courier: Courier, 
				items: List[CheckoutItem]) -> Order: 

	order_res = await s.execute(insert(Order).values(
		user_id = user_id, 
		restaurant_id = courier.restaurant.id, 
		courier_id = courier.id,
		created_at = datetime.now(UTC)
	).returning(Order))
	
	order = order_res.scalar()

	chain_id = courier.restaurant.chain_id
	for item in items: 
		menu_item_id_stm = select(MenuItem.id)\
			.where(and_(MenuItem.chain_id == chain_id, MenuItem.name == item.name))
		
		insert_stm = insert(OrderItem).values(
			order_id = order.id, 
			item_id = menu_item_id_stm.scalar_subquery(),
			price = item.price,
			currency = item.currency
		)

		await s.execute(insert_stm)

	await s.commit()

	return order

async def get_restaurants(s: AsyncSession, chain: str, from_ind: int=0 , count: int = None) -> List[Restaurant]: 
	rows = await s.execute(select(Restaurant)
						.join(Chain)
						.where(Chain.name == chain)
						.offset(from_ind).limit(count))
	return rows.scalars().all()

async def get_restaurant(s: AsyncSession, name: str):
	rows = await s.execute(select(Restaurant)
						.where(Restaurant.name == name).limit(1))
	return rows.scalar()

async def add_menu_item(s: AsyncSession, chain: str, 
				name, desc, price, currency, imgUrl) -> tuple[MenuItem, str]: 

	chain_id_stm = select(Chain.id).where(Chain.name==chain).limit(1)

	insert_stm = insert(MenuItem).values(
		name=name,
		description=desc, 
		price=price, 
		currency=currency, 
		imgUrl=imgUrl,
		chain_id=chain_id_stm.scalar_subquery()
	).returning(MenuItem)

	res = await s.execute(insert_stm)
	await s.commit()

	if res is None: 
		return (None, "Such menu item already exists.")
	else:
		return (res.scalar(), None)
		
async def get_menu_items(s: AsyncSession, 
				chain_id: int, 
				sort: Sort,
				from_ind: int=0, 
				count:int=None) -> List[MenuItem]:

	avg_subquery = select(FoodReview.item_id, func.avg(FoodReview.rating).label("avg_rating"))\
				.group_by(FoodReview.item_id)\
				.subquery()


	sort_args = {
		Sort.byName: MenuItem.name,
		Sort.byPrice: MenuItem.price,
		Sort.byRating: avg_subquery.c.avg_rating.desc()
	}

	if sort not in sort_args: 
		print("Invalid sort provied for menu items.")
		return []

	items = await s.execute(select(MenuItem)
					.outerjoin(avg_subquery, avg_subquery.c.item_id == MenuItem.id)
					.where(MenuItem.chain_id == chain_id)
					.order_by(sort_args[sort])
					.offset(from_ind)
					.limit(count))
	
	return items.scalars()

async def get_menu_item(s: AsyncSession, chain: str, item: str): 
	rows = await s.execute(select(MenuItem)
						.join(Chain)
						.where(and_(Chain.name == chain, MenuItem.name == item))
						.limit(1))
	
	return rows.scalar()

async def update_menu_item(s: AsyncSession, chain: str, item: str, 
						   desc: str, imgUrl:str, price: float, currency: str): 
	
	stm = update(MenuItem)\
		.values(
			description = desc, 
			price = price, 
			imgUrl = imgUrl,
			currency = currency
		).where(MenuItem.chain_id == Chain.id)\
		.where(and_(Chain.name == chain, MenuItem.name == item))\
		.returning(MenuItem)

	
	row = await s.execute(stm)
	await s.commit()

	return row.scalar()

async def delete_menu_item(s: AsyncSession, chain: str, item: str): 

	chain_id_row = await s.execute(select(Chain.id).where(Chain.name == chain))
	chain_id = chain_id_row.scalar()

	await s.execute(delete(MenuItem)\
				 .where(and_(MenuItem.chain_id == chain_id, 
							MenuItem.name == item)))
				 
	await s.commit()

	return True

async def get_user_by_token(s: AsyncSession, token: str) -> User: 
	row = await s.execute(select(User).where(User.tokens_id == token))

	return row.scalar()

async def get_user_by_email(s: AsyncSession, email: str) -> User: 
	row = await s.execute(select(User).where(User.email == email))
	return row.scalar()

async def remove_user(s: AsyncSession, email:str) -> bool:
	await s.execute(delete(User).where(User.email == email))
	await s.commit()
	return True

async def add_user(s: AsyncSession, 
				token: str, 
				email:str, 
				address: str,
				long: float, 
				lat: float) -> User:
	
	user = User(email=email, 
			tokens_id=token, 
			address=address,
			long=long, 
			lat=lat)

	s.add(user)

	await s.commit()
	await s.refresh(user)

	return s

async def is_admin_of(s: AsyncSession, token: str, chain: str) -> bool:
	role_res = await get_roles_by_token(s, token)
	if role_res[0] is None: 
		return False
	
	is_admin_cond = lambda r: r.chain.name == chain and r.role_name == "admin"
	role = next(filter(is_admin_cond, role_res[0]), None)

	return role is not None

async def get_roles_by_token(s: AsyncSession, token: str) -> tuple[List[Role], str]: 
	user_id_stm = select(User.id).where(User.tokens_id == token).limit(1)
	user_id_res = await s.execute(user_id_stm)
	user_id = user_id_res.scalar()
	if user_id is None: 
		return (None, "No such user.")

	select_roles_stm = select(Role).where(Role.user_id == user_id)
	select_role_res = await s.execute(select_roles_stm)
	roles = select_role_res.scalars().all()

	return (roles, None)

async def get_roles_by_mail(s: AsyncSession, user_email: str) -> tuple[List[Role], str]: 
	user_id_stm = select(User.id).where(User.email == user_email).limit(1)
	user_id_res = await s.execute(user_id_stm)
	user_id = user_id_res.scalar()
	if user_id is None: 
		return (None, "No such user.")

	select_roles_stm = select(Role).where(Role.user_id == user_id)
	select_role_res = await s.execute(select_roles_stm)
	roles = select_role_res.scalars().all()

	return (roles, None)

async def add_role(s: AsyncSession, email: str, chain: str, role: str) -> tuple[Role, str]: 

	user_id_stm = select(User.id).where(User.email == email).limit(1)
	user_id_res = await s.execute(user_id_stm)
	user_id = user_id_res.scalar()
	if user_id is None: 
		return (None, f"No such user: {email}")

	chain_id_stm = select(Chain.id).where(Chain.name == chain).limit(1)	
	chain_id_res = await s.execute(chain_id_stm)
	chain_id = chain_id_res.scalar()
	if chain_id is None: 
		return (None, f"No such chain: {chain}")
	
	insert_stm = insert(Role).values(
		user_id = user_id,
		chain_id = chain_id,
		role_name=role
	).returning(Role)

	res = await s.execute(insert_stm)
	await s.commit()

	if res is not None: 
		return (res.scalar(), None)
	else: 
		return (None, "Failed to add role.")

async def remove_role(s: AsyncSession, email: str, chain: str, role: str) -> tuple[bool, str]:

	user_id_stm = select(User.id).where(User.email == email).limit(1)
	user_id_res = await s.execute(user_id_stm)
	user_id = user_id_res.scalar()
	if user_id is None: 
		return (False, "No such user.")

	chain_id_stm = select(Chain.id).where(Chain.name == chain).limit(1)	
	chain_id_res = await s.execute(chain_id_stm).scalar()
	chain_id = chain_id_res.scalar()
	if chain_id is None: 
		return (False, "No such chain.")

	cond = and_(Role.user_id == user_id, 
			 	Role.chain_id == chain_id, 
				Role.role_name == role)
	
	await s.execute(delete(Role).where(cond))
	await s.commit()

	return (True, None)

async def get_courier(s: AsyncSession, email:str) -> Courier: 
	stm = select(Courier).join(User).where(User.email == email).limit(1)
	row = await s.execute(stm)
	return row.scalar()

async def add_courier(s: AsyncSession, email: str, restName: str) -> Courier: 
	print("Regular courier insertion.")
	rest_id_stm = select(Restaurant.id).where(Restaurant.name == restName).limit(1)
	user_id_stm = select(User.id).where(User.email == email).limit(1)
	stm = insert(Courier)\
		.values(
			user_id = user_id_stm.scalar_subquery(),
			lat=15,
			long=120,
			restaurant_id = rest_id_stm.scalar_subquery()
		).returning(Courier)
	
	row = await s.execute(stm)
	await s.commit()

	return row.scalar()

async def get_couriers(s: AsyncSession, rest: str) -> List[Courier]: 
	rows = await s.execute(select(Courier)\
						.join(Restaurant)\
						.where(and_(Restaurant.id == Courier.restaurant_id,
									Restaurant.name == rest)))
	return rows.scalars().all()

async def doing_delivery(s: AsyncSession, courier: str) -> bool:

	rows = await s.execute(select(Order)\
				.join(Courier)\
				.join(User)\
				.where(and_(User.email == courier, Order.delivered_at == None)))
	
	data = rows.scalars().all()

	return len(data) != 0

async def remove_courier(s: AsyncSession, courier: str) -> bool:
	user_row = await s.execute(select(User).where(User.email == courier).limit(1))
	user = user_row.scalar()

	await s.execute(delete(Courier).where(Courier.user_id == user.id))
	await s.commit()
	return True

# TODO should be removed 
async def reassign_courier(s: AsyncSession, 
						courier: Courier, 
						restName: str) -> Courier:
	print("Will reassign courier.")
	non_delivered_stm = select(Order)\
					.where(and_(Order.courier_id == courier.id,
								Order.delivered_at == None))
	
	non_delivered_rows = await s.execute(non_delivered_rows)
	non_delivered_ord = non_delivered_rows.scalar()
	if non_delivered_ord is not None: 
		print("Courier occupied, cant reassign it.")
		return None
	
	rest_stm = select(Restaurant.id).where(Restaurant.name == restName).limit(1)

	print("Reassigning.")

	await s.execute(delete(Courier).where(Courier.id == courier.id))

	insert_stm = insert(Courier)\
			.values(
				user_id = courier.user_id,
				lat = courier.lat, 
				long = courier.long, 
				restaurant_id = rest_stm.scalar_subquery()
			).returning(Courier)
	
	insert_row = await s.execute(insert_stm)
	await s.commit()

	return insert_row.scalar()

async def get_waitings_orders_by_token(s: AsyncSession, token: str) -> List[Order]: 
	
	stm = select(Order).join(User)\
		.where(and_(User.tokens_id == token, Order.delivered_at == None))
	
	rows = await s.execute(stm)

	return rows.scalars().all()

async def get_rating(s: AsyncSession, chain: str, item: str) -> float: 

	stm = select(func.avg(FoodReview.rating))\
			.join(MenuItem).join(Chain)\
			.where(and_(Chain.name == chain, MenuItem.name == item))

	row = await s.execute(stm)

	return row.scalar()

async def have_ordered(s: AsyncSession, chain: str, item: str, user_token: str) -> bool: 

	stm = select(OrderItem.id).join(Order).join(User)\
			.where(User.tokens_id == user_token)\
			.join(MenuItem).where(MenuItem.name == item)\
			.join(Chain).where(Chain.name == "2x2")
	
	row = await s.execute(stm)

	return row.first() is not None

async def get_review(s: AsyncSession, chain: str, item: str, user_token:str) -> FoodReview:
	stm = select(FoodReview).join(User).where(User.tokens_id == user_token)\
				.join(MenuItem).join(Chain)\
				.where(and_(Chain.name == chain, MenuItem.name == item))
	
	rows = await s.execute(stm)
	return rows.scalar()

async def get_reviews(s: AsyncSession, chain:str, item:str, 
					  from_ind: int, count:int) -> List[FoodReview]: 
	
	stm = select(FoodReview).join(MenuItem).join(Chain)\
			.where(and_(Chain.name == chain, MenuItem.name == item))\
			.offset(from_ind).limit(count)

	rows = await s.execute(stm)
	return rows.scalars().all()

async def add_review(s: AsyncSession, chain: str, itemName: str, rating: float,
					 comment:str, user_token:str) -> FoodReview: 

	item_id_stm = select(MenuItem.id).join(Chain)\
		.where(and_(Chain.name == chain, MenuItem.name == itemName))
	user_id_stm = select(User.id).where(User.tokens_id == user_token)

	row = await s.execute(insert(FoodReview).values(
		item_id = item_id_stm.scalar_subquery(),
		user_id = user_id_stm.scalar_subquery(),
		rating = rating, 
		comment = comment
	).returning(FoodReview))

	await s.commit()

	return row.scalar()