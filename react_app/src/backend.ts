import { UpdateBundleProject } from "typescript";
import {
	Chain, CheckoutResponse, CheckoutRequest, MenuItem, User,
	OrderItem, CardDetails, CheckoutItem, CheckoutResponseType,
	Sort, AddItemResponse, AddItemResponseType, Role, AddRestResponse,
	AddRestResponseType, Restaurant, AddCourierResponse, AddCourierRequest,
	AddCourierResponseType,
	UpdateRestRequest,
	Courier,
	AddRestaurantRequest,
	MenuItemRequest,
	FoodReview,
	PostReviewRequest
} from "./datas";

function chainsUrl(f: number, cnt: number, sort: Sort): string {
	return `http://localhost:8080/chains?from_ind=${f}&count=${cnt}&sort=${sort}`
}

function menuItemsUrl(chain: string, f: number, cnt: number, sort: Sort): string {
	return `http://localhost:8080/menu?chain=${chain}&from_ind=${f}&count=${cnt}&sort=${sort}`
}

function menuItemUrl(chain: string, item: string): string {
	return `http://localhost:8080/item?chain=${chain}&item=${item}`
}

function updateMenuItemUrl(): string {
	return `http://localhost:8080/menu`
}

function deleteMenuItemUrl(chain: string, item: string): string {
	return `http://localhost:8080/menu?chain=${chain}&item=${item}`
}

function userDataUrl(tokensId: string): string {
	return `http://localhost:8080/user?tokens_id=${tokensId}`
}

function checkoutUrl(): string {
	return `http://localhost:8080/checkout`
}

function addItemUrl(): string {
	return `http://localhost:8080/menu`
}

function getRolesUrl(email: string): string {
	return `http://localhost:8080/roles?user_email=${email}`
}

function getAddRestUrl(): string {
	return `http://localhost:8080/restaurant`
}

function addCourierUrl(): string {
	return `http://localhost:8080/courier`
}

function getCouriersUrl(rest: string): string {
	return `http://localhost:8080/couriers?restaurant=${rest}`
}

function deleteCourierUrl(rest: string, courier: string): string {
	return `http://localhost:8080/courier?restaurant=${rest}&courier=${courier}`
}

function getRestaurantsUrl(chain: string): string {
	return `http://localhost:8080/restaurants?chain=${chain}`
}

function getOldOrders(): string {
	return "http://localhost:8080/orders/waiting"
}

function getRestaurantUrl(rest: string): string {
	// restaurant name is unique
	return `http://localhost:8080/restaurant/${rest}`
}

function getUpdateRestUrl(): string {
	return `http://localhost:8080/restaurant`
}

function getRemoveResturl(): string {
	return `http://localhost:8080/restaurant`
}

function getRatingUrl(chain: string, item: string): string {
	return `http://localhost:8080/rating?chain=${chain}&item=${item}`
}

function getReviewsUrl(chain: string, item: string, f: number, c: number): string {
	return `http://localhost:8080/reviews?chain=${chain}&itemName=${item}&from_ind=${f}&count=${c}`
}

function getCanCommentUrl(chain: string, item: string): string {
	return `http://localhost:8080/canreview?chain=${chain}&item=${item}`
}

function getPostReviewUrl(): string {
	return `http://localhost:8080/review`
}

/// APIS

export async function loadChains(f: number, cnt: number, sort: Sort): Promise<Chain[]> {

	try {
		const res = await fetch(chainsUrl(f, cnt, sort))

		if (res.status != 200) {
			throw Error("Failed to load new chains: " + await res.text())
		}

		return await res.json() as Chain[]
	} catch (e) {
		console.log("Caught: " + e + " ; while fetching chains")
		return []
	}

}

export async function loadMenuItems(chain: string,
	f: number,
	cnt: number,
	sort: Sort): Promise<MenuItem[]> {

	try {
		const res = await fetch(menuItemsUrl(chain, f, cnt, sort))

		if (res.status != 200) {
			throw Error("Failed to fetch menu items: " + await res.text())
		}

		return await res.json() as MenuItem[]

	} catch (e) {
		console.log("Caught: " + e + "; while fetching menu items.")
		return []
	}

}

export async function loadMenuItem(chain: string, itemName: string): Promise<MenuItem | undefined> {
	try {
		const url = menuItemUrl(chain, itemName)
		const res = await fetch(url)

		if (res.status != 200) {
			throw Error("Failed to fetch menu items: " + await res.text())
		}

		return await res.json() as MenuItem

	} catch (e) {
		console.log("Caught: " + e + "; while fetching menu items.")
		return undefined
	}
}

export async function updateMenuItem(chain: string, item: string,
	desc: string, imgUrl: string, price: number,
	currency: string): Promise<boolean> {

	let url = updateMenuItemUrl()

	try {

		let reqData = {
			chain: chain,
			item: {
				name: item,
				description: desc,
				imgUrl: imgUrl,
				price: price,
				currency: currency
			}
		} as MenuItemRequest

		let res = await fetch(url,
			{
				method: "PUT",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		return res.status == 200
	} catch (e) {
		console.log("Filed to update restaurant: " + e)
		return false
	}
}

export async function deleteMenuItem(chain: string, item: string): Promise<boolean> {
	let url = deleteMenuItemUrl(chain, item)

	try {

		let res = await fetch(url, { method: "DELETE" })

		return res.status == 200
	} catch (e) {
		console.log("Filed to delete restaurant: " + e)
		return false
	}

}

export async function getUserData(tokensId: string): Promise<User | undefined> {

	try {
		let infoUrl = userDataUrl(tokensId)
		let response = await fetch(infoUrl, { method: 'GET' })

		if (response.status != 200) {
			throw Error("Status code: " + response.status)
		}

		let info = await response.json() as User
		console.log("Fetched user: " + JSON.stringify(info))

		return info
	} catch (e) {
		console.log("Error while fetching user data: " + e)
		return undefined
	}

}

export async function getRoles(email: string): Promise<Role[]> {

	try {
		let url = getRolesUrl(email)
		let res = await fetch(url)

		if (res.status != 200) {
			throw Error("Fetch roles status: " + res.status)
		}

		return await res.json() as Role[]
	} catch (e) {
		console.log("Failed to fetch roles: " + e)
		return []
	}
}

function asCheckoutItem(item: MenuItem): CheckoutItem {
	return {
		name: item.name,
		price: item.price,
		currency: item.currency
	} as CheckoutItem
}

export async function performCheckout(item: OrderItem,
	card: CardDetails,
	address: string): Promise<CheckoutResponse> {

	let reqData = {
		chain: item.chain,
		items: item.items.map(asCheckoutItem),
		address: address,
		cardData: card.data
	} as CheckoutRequest

	try {
		let url = checkoutUrl()
		let res = await fetch(url,
			{
				method: "POST",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			},
		)

		if (res == undefined || res.status != 200) {
			throw Error("Checkout request failed")
		}

		return await res.json() as CheckoutResponse
	} catch (e) {
		console.log("Failed to perform checkout: " + e)
		return { responseType: CheckoutResponseType.FAILED } as CheckoutResponse
	}

}

export async function addMenuItem(chain: string, name: string, desc: string,
	price: number, currency: string, imgUrl: string): Promise<AddItemResponse> {

	let url = addItemUrl()
	try {

		let reqData = {
			chain: chain,
			item: {
				name: name,
				description: desc,
				price: price,
				currency: currency,
				imgUrl: imgUrl
			}
		} as MenuItemRequest

		let res = await fetch(url,
			{
				method: "POST",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		return await res.json() as AddItemResponse
	} catch (e) {
		console.log("Failed to add menu item.")
		return { type: AddItemResponseType.FAILED } as AddItemResponse
	}
}

export async function addRest(chain: string, name: string, address: string): Promise<AddRestResponse> {

	let url = getAddRestUrl()

	try {

		let reqData = {
			chain: chain,
			rest: {
				name: name,
				address: address
			}
		} as AddRestaurantRequest

		let res = await fetch(url,
			{
				method: "POST",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		return await res.json() as AddRestResponse
	} catch (e) {
		console.log("Filed to add rest: " + e)
		return { type: AddRestResponseType.FAILED } as AddRestResponse
	}

}

export async function addCourier(chainName: string,
	email: string,
	restName: string): Promise<AddCourierResponse> {

	let url = addCourierUrl()

	try {

		let reqData = {
			email: email,
			chainName: chainName,
			restaurantName: restName
		} as AddCourierRequest

		let res = await fetch(url,
			{
				method: "POST",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		if(!res.ok){
			throw Error("Add courier status: " + res.ok)
		}

		return await res.json() as AddCourierResponse
	} catch (e) {
		console.log("Filed to add courier: " + e)
		return { type: AddCourierResponseType.FAILED } as AddCourierResponse
	}
}

export async function getCouriers(rest: string): Promise<Courier[]> {

	try {
		let url = getCouriersUrl(rest)
		let res = await fetch(url)

		if (res.status != 200) {
			throw Error("Fetch couriers status: " + res.status)
		}

		return await res.json() as Courier[]
	} catch (e) {
		console.log("Failed to fetch couriers: " + e)
		return []
	}
}

export async function deleteCourier(rest: string, courier: string): Promise<boolean> {
	try {
		let url = deleteCourierUrl(rest, courier)
		let res = await fetch(url, { method: 'DELETE' })

		if (res.status != 200) {
			throw Error("Delete courier status: " + res.status)
		}

		return true
	} catch (e) {
		console.log("Failed to delete courier: " + e)
		return false
	}
}

export async function getRestaurants(chain: string): Promise<Restaurant[]> {

	console.log("Fetching restaurants.")

	try {
		let url = getRestaurantsUrl(chain)

		let res = await fetch(url)

		if (res.status != 200) {
			throw Error("Fetch rests status: " + res.status)
		}

		return await res.json() as Restaurant[]
	} catch (e) {
		console.log("Failed to fetch restaurants: " + e)
		return []
	}

}

export async function loadWaitingOrders(): Promise<CheckoutResponse[]> {
	try {
		let url = getOldOrders()
		let res = await fetch(url)

		if (res.status != 200) {
			throw Error("Fetch old orders status: " + res.status)
		}

		return await res.json() as CheckoutResponse[]
	} catch (e) {
		console.log("Failed to fetch old orders: " + e)
		return []
	}
}

export async function getRestaurant(rest: string): Promise<Restaurant | undefined> {
	try {
		let url = getRestaurantUrl(rest)
		let res = await fetch(url)

		if (res.status != 200) {
			throw Error("Fetch old orders status: " + res.status)
		}

		return await res.json() as Restaurant
	} catch (e) {
		console.log("Failed to fetch old orders: " + e)
		return undefined
	}

}

export async function updateRest(chain: string, rest: string, address: string): Promise<boolean> {

	let url = getUpdateRestUrl()

	try {

		let reqData = {
			chain: chain,
			restaurant: rest,
			address: address
		} as UpdateRestRequest

		let res = await fetch(url,
			{
				method: "PUT",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		return res.status == 200
	} catch (e) {
		console.log("Filed to update restaurant: " + e)
		return false
	}

}

export async function removeRest(chain: string, rest: string): Promise<boolean> {

	let url = getRemoveResturl()

	try {

		let reqData = {
			chain: chain,
			restaurant: rest,
			address: "" // will be ignored on backend
		} as UpdateRestRequest

		let res = await fetch(url,
			{
				method: "DELETE",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		return res.status == 200
	} catch (e) {
		console.log("Filed to delete restaurant: " + e)
		return false
	}

}

export async function getRating(chain: string, item: string): Promise<number> {
	try {

		let res = await fetch(getRatingUrl(chain, item))
		if (!res.ok) {
			throw Error("Fetch ratings status: " + res.status)
		}

		return +(await res.text()) // this should return it as value
	} catch (e) {
		console.log("Failed to fetch ratings: " + e)
		return -1
	}
}

export async function getReviews(chain: string,
	item: string,
	fromInd: number,
	count: number): Promise<FoodReview[]> {

	try {

		let res = await fetch(getReviewsUrl(chain, item, fromInd, count))

		if (!res.ok) {
			console.log("Fetch ratings status: " + res.status)
			throw Error("Fetch ratings status: " + res.status)
		}

		return (await res.json()) as FoodReview[]
	} catch (e) {
		console.log("Failed to fetch ratings: " + e)
		return []
	}
}

export async function getCanReview(chain: string, itemName: string): Promise<boolean> {

	try {

		let res = await fetch(getCanCommentUrl(chain, itemName))
		if (!res.ok) {
			throw Error("Checking if have ordered before, status: " + res.status)
		}

		return true
	} catch (e) {
		console.log("Failed to check if have ordere before: " + e)
		return false
	}
}

export async function postReview(chain: string, item: string, rating: number,
	comment: string): Promise<FoodReview | undefined> {

	let url = getPostReviewUrl()

	try {

		let reqData = {
			chain: chain,
			itemName: item,
			rating: rating,
			comment: comment
		} as PostReviewRequest

		let res = await fetch(url,
			{
				method: "POST",
				headers: {
					'Content-type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(reqData)
			})

		if (!res.ok) {
			throw Error("Post review status: " + res.status)
		}

		return await res.json() as FoodReview
	} catch (e) {
		console.log("Filed to post review: " + e)
		return undefined
	}

}