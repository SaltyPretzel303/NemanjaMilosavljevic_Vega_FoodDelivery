from dataclasses import dataclass
from datetime import datetime
from enum import Enum, IntEnum
from typing import List

@dataclass 
class Coords: 
	lat: float
	long: float

@dataclass 
class MenuItem:  
	name: str
	description: str
	price: float
	currency: str
	imgUrl: str

@dataclass 
class Restaurant: 
	name: str
	address: str

@dataclass 
class Chain: 
	chainName: str 
	description: str

@dataclass 
class Courier: 
	email: str 
	restaurant: str

@dataclass 
class User: 
	email: str
	address: str
	long: float
	lat: float

@dataclass 
class Role: 
	userEmail: str
	chainName: str
	role: str

@dataclass 
class CheckoutItem: 
	name: str
	price: float 
	currency: str

@dataclass
class CheckoutRequest: 
	chain: str
	items: List[CheckoutItem]
	address: str
	cardData: str

@dataclass
class CheckoutResponse: 

	class Type(Enum):
		SUCCESS = 1
		INVALID_CARD = 2
		TOO_BUSY = 3 
		FAILED = 4

	orderId: int = None
	responseType: Type = None
	courier: str = None
	restaurant: str = None
	# deliveryTime: datetime = None
	deliveryTime: str = None

	def invalid_card():
		return CheckoutResponse(responseType=CheckoutResponse.Type.INVALID_CARD)
	
	def too_busy(): 
		return CheckoutResponse(responseType=CheckoutResponse.Type.TOO_BUSY)
	
	def success(orderId: int, courier: str, restaurant: str, delivery_time: datetime): 
		return CheckoutResponse(responseType=CheckoutResponse.Type.SUCCESS, 
						orderId=orderId,
						courier=courier, 
						restaurant=restaurant, 
						deliveryTime=delivery_time)
	
	def failed():
		return CheckoutResponse(responseType=CheckoutResponse.Type.FAILED)

@dataclass 
class RoleRequest:
	rootKey: str
	role: Role

@dataclass
class ChainRequest:
	rootKey: str
	chain: Chain

class Sort(IntEnum): 
	byName = 1,
	byRating = 2, 
	byPrice = 3, 

@dataclass 
class AddCourierRequest:
	email: str
	restaurantName: str
	chainName: str

class AddCourierResponseType(IntEnum): 
	SUCCESS = 1,
	NO_SUCH_USER = 2,
	COURIER_OCCUPIED = 3,
	POSITION_OCCUPIED = 4,
	FAILED = 5

@dataclass
class AddCourierResponse: 
	type: AddCourierResponseType

	@staticmethod
	def success():
		return AddCourierResponse(type = AddCourierResponseType.SUCCESS)
	
	@staticmethod
	def no_such_user():
		return AddCourierResponse(type = AddCourierResponseType.NO_SUCH_USER)
	
	@staticmethod
	def occupied():
		return AddCourierResponse(type = AddCourierResponseType.COURIER_OCCUPIED)
	
	@staticmethod
	def failed():
		return AddCourierResponse(type = AddCourierResponseType.FAILED)

	@staticmethod
	def position_occupied(): 
		return AddCourierResponse(type = AddCourierResponseType.POSITION_OCCUPIED)

@dataclass
class UpdateRestRequest:
	chain: str
	restaurant: str
	address: str

@dataclass 
class AddRestaurantRequest: 
	chain: str
	rest: Restaurant

@dataclass
class MenuItemRequest: 
	chain: str
	item: MenuItem
