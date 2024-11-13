export interface User {
	email: string
	address: string
}

export interface Role {
	userEmail: string,
	chainName: string,
	role: string
}

export interface MenuItem {
	name: string
	description: string
	price: number
	currency: string
	imgUrl: string
}

export interface Chain {
	chainName: string
	description: string
}

export interface Point {
	long: number
	lat: number
}

export interface Restaurant {
	name: string
	address: string
}

export interface CardDetails {
	data: string
}

export interface OrderFromChain {
	chainName: string
	menuItem: MenuItem
}

export interface OrderItem {
	chain: string
	items: MenuItem[]
	total: number
	currency: string

	// response: CheckoutResponse
}

export interface CheckoutItem {
	name: string
	price: number
	currency: string
}

export interface CheckoutRequest {
	chain: string
	items: CheckoutItem[]
	address: string
	cardData: string
}

export function isSuccess(resp: CheckoutResponse): boolean {
	return resp.responseType == CheckoutResponseType.SUCCESS
}

export enum CheckoutResponseType {
	SUCCESS = 1,
	INVALID_CARD = 2,
	TOO_BUSY = 3,
	FAILED = 4
}

export interface CheckoutResponse {
	orderId: number
	responseType: CheckoutResponseType
	courier: string
	restaurant: string
	deliveryTime: string // should be date
}

export enum Sort {
	byName = 1,
	byRating = 2,
	byPrice = 3,
}

export enum AddItemResponseType {
	SUCCESS = 1,
	ALREADY_EXISTS = 2,
	FAILED = 3
}

export interface AddItemResponse {
	type: AddItemResponseType
}

export enum AddRestResponseType {
	SUCCESS = 1,
	ALREADY_EXISTS = 2,
	FAILED = 3
}

export interface AddRestResponse {
	type: AddRestResponseType
}

export interface Courier {
	email: string
	restaurant: string
}

export interface AddCourierRequest {
	email: string
	chainName: string
	restaurantName: string
}

export enum AddCourierResponseType {
	SUCCESS = 1,
	NO_SUCH_USER = 2,
	COURIER_OCCUPIED = 3,
	POSITION_OCCUPIED = 4,
	FAILED = 5
}

export interface AddCourierResponse {
	type: AddCourierResponseType
}

export interface UpdateRestRequest {
	chain: string,
	restaurant: string,
	address: string
}

export interface AddRestaurantRequest {
	chain: string,
	rest: Restaurant
}

export interface MenuItemRequest { 
	chain: string 
	item: MenuItem
}