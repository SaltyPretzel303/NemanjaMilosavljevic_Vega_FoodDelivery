from datetime import timedelta
from typing import Any, Dict, List
from fastapi import APIRouter, FastAPI, HTTPException, Response, status

from fastapi import Depends

import src.database.db as crud
from src.database.session import gen_session
import src.model.mapper as mapper

from src.model.models import AddCourierRequest, AddCourierResponse, AddRestaurantRequest, Chain, ChainRequest, CheckoutRequest, CheckoutResponse, Courier, FoodReview, MenuItem, MenuItemRequest, PostReviewRequest, Restaurant, Role, Sort, UpdateRestRequest
from src.database.db_data import chains, foods

from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session

app = APIRouter()

@app.get("/fill_db")
async def yo(s=Depends(gen_session)):
	for chain in chains:
		print(f"Adding chain: {chain.name} -> ", end="")
		add_res = await crud.add_chain(s, name=chain.name, description=chain.description )
		if add_res is None: 
			print("Failed")
		else: 
			print("Done")

	for item in foods: 
		print(f"Adding item: {item[1].name} to {item[0]} -> ", end="")
		add_res = await crud.add_menu_item(s, item[0], 
								item[1].name, 
								item[1].description, 
								item[1].price,
								item[1].currency, 
								item[1].imgUrl)
		if add_res is None: 
			print("Failed")
		else: 
			print("Done")
	
	return "All good"

async def is_root(user: str)->bool:
	return True

@app.post("/chain")
async def add_chain(data: ChainRequest, db_session  = Depends(gen_session)):

	print(f"Processing add chain request for: {data.chain.chainName}")

	if not is_root(data.rootKey): 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
					  detail="Please provide valid root key.")

	add_res = await crud.add_chain(db_session, 
						data.chain.chainName, 
						data.chain.description)

	if add_res[0] is None: 
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, 
					  detail=add_res[1])

	return mapper.as_chain(add_res[0])

@app.get("/chain")
async def get_chain(name: str, db_session = Depends(gen_session)):
	
	print(f"Processing get chain request for: {name}")

	if name is None or len(name) == 0:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
			detail="Empty string is not allowed as name.")

	chain = await crud.get_chain(db_session, name)
	if chain is None: 
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
			detail="No such chain.")
	
	return mapper.as_chain(chain)

@app.get("/chains", response_model=List[Chain])
async def get_chains(from_ind:int = 0, 
				count: int = 3, 
				sort: Sort = Sort.byName,
				db_session = Depends(gen_session)) -> Chain:
	
	print(f"Processing get chains from: {from_ind} cnt: {count}")

	chains = await crud.get_chains(db_session, sort, from_ind, count)

	return [mapper.as_chain(db_chain) for db_chain in chains]

@app.post("/restaurant")
async def add_restaurant(data: AddRestaurantRequest,
					auth_session: SessionContainer = Depends(verify_session()),
					db_session = Depends(gen_session)):
	
	print("Processing add restaurant request")

	if not await crud.is_admin_of(db_session, auth_session.user_id, data.chain):
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="This user is not authorized for such action.")

	# TODO again do some geolocation
	long = 20
	lat = 22
	add_res = await crud.add_restourant(db_session, 
									data.chain,
									data.rest.name, 
							 		data.rest.address,
									long, lat)

	if add_res[0] is None: 
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, 
					  detail=add_res[1])

	return mapper.as_restaurant(add_res[0])

@app.get("/restaurants")
async def get_restaurants(chain: str, db_session = Depends(gen_session)):
	db_rests = await crud.get_restaurants(db_session, chain)
	return [mapper.as_restaurant(rest) for rest in db_rests]

@app.get("/restaurant/{name}")
async def get_restaurant(name: str, db_s = Depends(gen_session)):
	data = await crud.get_restaurant(db_s, name)
	if (data is not None): 
		return mapper.as_restaurant(data)
	else:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
					  detail="No such restaurant.")

@app.put("/restaurant")
async def update_restaurant(data: UpdateRestRequest, 
						s = Depends(verify_session()),
						db_s = Depends(gen_session)): 
	
	if not await crud.is_admin_of(db_s, s.user_id, data.chain): 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="Not authorized for updates on this chain.")
	
	print(f"Processing update rest {data.restaurant} with: {data.address}")

	update_res = await crud.update_restourant(db_s, data.restaurant, data.address)

	if update_res: 
		return # this will be empty response with code 200
	else: 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="Failed to update restaurant")
	
@app.delete("/restaurant")
async def delete_restaurant(data: UpdateRestRequest,
						s = Depends(verify_session()),
						db_s = Depends(gen_session)): 
	
	if not await crud.is_admin_of(db_s, s.user_id, data.chain): 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="Not authorized for updates on this chain.")

	if await crud.has_active_orders(db_s, data.restaurant): 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="Restaurant still has active orders.")

	del_res = await crud.delete_restaurant(db_s, data.restaurant)

	if not del_res: 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="Cant delete this restaurant right now.")
	
	# will just return empty 200

@app.post("/menu")
async def add_menu_item(data: MenuItemRequest,
					auth_session: SessionContainer = Depends(verify_session()),
					db_session = Depends(gen_session)): 

	print(f"Processing add menu item request: {data.item.name}")

	if not await crud.is_admin_of(db_session, auth_session.user_id, data.chain):
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="This user has no admin role in this chain.")

	add_res = await crud.add_menu_item(db_session, data.chain, data.item.name, 
								data.item.description, data.item.price, 
								data.item.currency, data.item.imgUrl)

	if add_res[0] is None: 
		raise HTTPException(status_code=status.HTTP_409_CONFLICT,
					detail=add_res[1])

	return mapper.as_menu_item(add_res[0])

@app.get("/menu", response_model=List[MenuItem])
async def get_menu(chain:str, 
				from_ind:int=0, 
				count:int=5,
				sort: Sort = Sort.byName,
				db_session = Depends(gen_session)): 
	
	db_chain = await crud.get_chain(db_session, chain)

	if db_chain is None: 
		raise HTTPException(status.HTTP_404_NOT_FOUND,
					  detail="No such chain.")
	
	db_items = await crud.get_menu_items(db_session, db_chain.id, sort, from_ind, count)

	return [mapper.as_menu_item(item) for item in db_items]

@app.get("/item")
async def get_menu_item(chain: str, item: str, db = Depends(gen_session)): 

	item = await crud.get_menu_item(db, chain, item)

	if item is not None: 
		return mapper.as_menu_item(item)
	else:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
					  detail='No such menu item.')

@app.put("/menu")
async def update_menu_item(data: MenuItemRequest, 
						s = Depends(verify_session()),
						db = Depends(gen_session)): 

	if not await crud.is_admin_of(db, s.user_id, data.chain): 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
					  detail="User is not admin for this chain.")

	res = await crud.update_menu_item(db, data.chain, data.item.name, 
								data.item.description, data.item.imgUrl, 
								data.item.price, data.item.currency)

	if res is not None: 
		return mapper.as_menu_item(res)
	else: 
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
					  detail="Failed to update, item could be missing." )

@app.delete("/menu")
async def delete_menu_item(chain: str, item: str, 
						s = Depends(verify_session()),
						db = Depends(gen_session)):
	
	if not await crud.is_admin_of(db, s.user_id, chain): 
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
					detail='This user is not admin for this chain.')

	await crud.delete_menu_item(db, chain, item)
	
async def validate_card(card_data: str):
	return True # yup

# Actually contact courier or a restaurant and make them confirm the order.
async def courier_available(c: Courier): 
	return True

async def restaurant_available(r: Restaurant): 
	return True

@app.post("/checkout")
async def checkout(data: CheckoutRequest, 
				auth_session: SessionContainer = Depends(verify_session()),
				db_s = Depends(gen_session)):

	print("Processing checkout request.")

	valid_card = await validate_card(data.cardData)

	if not valid_card: 
		return CheckoutResponse.invalid_card()

	user = await crud.get_user_by_token(db_s, auth_session.user_id)

	free_courier = await crud.get_free_courier(db_s, data.chain, user.long, user.lat)
	if free_courier is None: 
		return CheckoutResponse.too_busy()
	
	if not await courier_available(free_courier) or\
		 not await restaurant_available(free_courier.restaurant): 
		return CheckoutResponse.too_busy()
	
	order = await crud.add_order(db_s, user.id, free_courier, data.items)
	if order is None: 
		return CheckoutResponse.failed()
	
	delivery_time = order.created_at + timedelta(minutes=15)

	return CheckoutResponse.success(orderId=order.id, 
								courier=free_courier.user.email,
								restaurant=free_courier.restaurant.name, 
								delivery_time=delivery_time)

@app.get("/orders/waiting")
async def get_waiting_orders(s = Depends(verify_session()),
					db_s = Depends(gen_session)):

	data = await crud.get_waitings_orders_by_token(db_s, s.user_id)

	return [mapper.as_checkout_response(resp) for resp in data]

@app.post("/courier")
async def add_courier(data: AddCourierRequest,
				session = Depends(verify_session()),
				db_s = Depends(gen_session)):
	
	print(f"Processing add courier request: {data.email}")

	if not await crud.is_admin_of(db_s, session.user_id, data.chainName):
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
					  detail="User is not chain admin.")

	existing = await crud.get_couriers(db_s, data.restaurantName)

	if len(existing) > 0:
		return AddCourierResponse.position_occupied()

	user = await crud.get_user_by_email(db_s, data.email)
	if user is None:
		return AddCourierResponse.no_such_user()

	courier = await crud.get_courier(db_s, data.email)

	if courier is None:
		res = await crud.add_courier(db_s, data.email, data.restaurantName)

		if res is not None: 
			return AddCourierResponse.success()
		else: 
			return  AddCourierResponse.failed()
	else:
		return AddCourierResponse.occupied()

@app.get("/couriers")
async def get_couriers(restaurant: str, db = Depends(gen_session)): 
	data = await crud.get_couriers(db, restaurant)

	return [mapper.as_courier(d.user.email, d.restaurant.name) for d in data ]

@app.delete("/courier")
async def del_courier(restaurant: str, 
					courier: str, 
					s = Depends(verify_session()),
					db = Depends(gen_session)): 

	rest = await crud.get_restaurant(db, restaurant)

	if not await crud.is_admin_of(db, s.user_id, rest.chain.name):
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
					  detail="User is not chain admin.")
	
	if await crud.doing_delivery(db, courier): 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="Courier is doing delivery.")
	
	await crud.remove_courier(db, courier)

	return 

@app.get("/rating")
async def get_rating(chain:str, item: str, 
					db = Depends(gen_session)):
	data = await crud.get_rating(db, chain, item)
	return data if data is not None else 0

@app.get("/canreview")
async def can_review(chain:str, item:str, 
					s = Depends(verify_session()),
					db = Depends(gen_session)):

	if not await crud.have_ordered(db, chain, item, s.user_id):
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					detail="You have never ordered this item.")
	
	if await crud.get_review(db, chain, item, s.user_id) is not None: 
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					detail="You already posted review.")

	return # Will return 200

@app.post("/review")
async def post_review(data: PostReviewRequest,
					s = Depends(verify_session()),
					db = Depends(gen_session)):
	
	ordered = await crud.have_ordered(db, data.chain, data.itemName, s.user_id)
	review = await crud.get_review(db, data.chain, data.itemName, s.user_id)

	if not ordered or review is not None:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
					  detail="You either already poste review or never order this item.")
	
	review = await crud.add_review(db, data.chain, data.itemName, 
								data.rating, data.comment, 
								s.user_id)

	if review is None: 
		raise HTTPException(status=status.HTTP_500_INTERNAL_SERVER_ERROR,
					  detail="Failed to add review.")
	
	return mapper.as_food_review(review.comment, review.rating, review.user.email)

@app.get("/reviews", response_model=List[FoodReview])
async def get_reviews(chain:str, itemName:str, 
					  from_ind:int=0, count: int=3, 
					  db = Depends(gen_session)): 
	
	data = await crud.get_reviews(db, chain, itemName, from_ind, count)
	return [mapper.as_food_review(review.comment, 
							review.rating, 
							review.user.email) for review in data]

# canComment ? haveOrdered and !commented
# postReview
# loadReviews