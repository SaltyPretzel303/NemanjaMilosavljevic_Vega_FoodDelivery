from datetime import datetime
import src.model.models as data
import src.database.models as db

def as_menu_item(item: db.MenuItem) -> data.MenuItem:
	return data.MenuItem(name=item.name, description=item.description, 
				price=item.price, currency=item.currency, imgUrl=item.imgUrl)

def as_chain(chain: db.Chain) -> data.Chain: 
	return data.Chain(chainName=chain.name, description=chain.description)

def as_restaurant(rest: db.Restaurant): 
	return data.Restaurant(name=rest.name, address=rest.address)

def as_user(user: db.User): 
	return data.User(email=user.email, address=user.address, 
				  long=user.long, lat=user.lat)

def as_role(role: db.Role): 
	return data.Role(userEmail=role.user.email, 
				  chainName=role.chain.name, 
				  role=role.role_name)

def as_courier(email: str, restaurant: str): 
	return data.Courier(email=email, restaurant=restaurant)


def as_checkout_response(order: db.Order): 
	return data.CheckoutResponse.success(order.id, 
									"some courier", 
									order.restaurant.name, 
									None)

def as_food_review(comment: str, rating: float, email:str): 
	return data.FoodReview(comment=comment, rating=rating, userEmail=email)
