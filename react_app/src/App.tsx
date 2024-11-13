import SuperTokens from 'supertokens-auth-react'
import EmailPassword, { OnHandleEventContext } from 'supertokens-auth-react/recipe/emailpassword'
import Session, { signOut } from 'supertokens-auth-react/recipe/session'
import { useEffect, useState } from 'react'
import { CardDetails, Chain, OrderItem, MenuItem, CheckoutResponse, User, Sort, AddItemResponse, Role, Restaurant, isSuccess, OrderFromChain, FoodReview } from './datas'
import LoginPopup from './LoginPopup'
import {
	addCourier, addMenuItem, addRest, deleteCourier, deleteMenuItem,
	getCouriers, getRestaurant, getRestaurants, getRoles,
	getUserData, loadChains, loadMenuItem, loadMenuItems,
	loadWaitingOrders, performCheckout, removeRest, updateMenuItem,
	updateRest, getRating, getReviews,
	getCanReview,
	postReview
} from './backend'
import MenuItemComponent from './MenuItemComponent'
import CartItem from './CartItem'
import CheckoutPopup from './CheckoutPopup'
import { Column, SortCriteria } from './Column'
import ChainPreview from './ChainPreview'
import Cart from './Cart'
import AdminMenuItemPopup from './AdminMenuItemPopup'
import AdminRestPopup from './AdminRestPopup'
import AdminCourierPopup from './AdminCourierPopup'

SuperTokens.init({
	appInfo: {
		appName: "react_app",
		apiDomain: `http://localhost:8080/`,
		apiBasePath: "/auth",
		websiteDomain: `http://localhost:3000`,
		websiteBasePath: "/"
	},
	disableAuthRoute: true,
	getRedirectionURL: async (context) => {
		if (context.action == "SUCCESS") {
			return null
		}
	},
	recipeList: [
		EmailPassword.init({
			onHandleEvent: async (context: OnHandleEventContext) => {
				if (context.action == "SUCCESS" && context.createdNewSession) {
					console.log("Successfull login/up")
				}
			},

			signInAndUpFeature: {
				signUpForm: {
					formFields: [
						{
							id: "address",
							label: "Delivery address",
							placeholder: "Enter your current address.",
							validate: async (value) => undefined
						}
					]
				}
			},
		}),
		Session.init({ sessionTokenFrontendDomain: `.localhost:3000` })
	]
})

export default function App() {

	const [user, setUser] = useState<User | undefined>(undefined)
	const [roles, setRoles] = useState<Role[]>([])
	const [loginVisible, setLoginVisible] = useState(false)

	const CHAINS_LOAD_COUNT = 3
	const [chains, setChains] = useState<Chain[]>([])
	const [selChain, setSelChain] = useState<Chain | undefined>(undefined)
	const [hasMoreChains, setHasMoreChains] = useState(true)

	const ITEMS_LOAD_COUNT = 3
	const [menuItems, setMenuItems] = useState<MenuItem[]>([])
	const [hasMoreItems, setHasMoreItems] = useState(true)

	const [oldOrders, setOldOrders] = useState<CheckoutResponse[]>([])
	const [orders, setOrders] = useState<OrderFromChain[]>([])

	const [checkoutVisible, setCheckoutVisible] = useState(false)
	const [toCheckOut, setToCheckOut] = useState<OrderItem | undefined>(undefined)

	const [chainsSort, setChainsSort] = useState(Sort.byName)
	const chainsSorts = [
		{ name: "By name", value: Sort.byName } as SortCriteria,
	]

	const [menuSort, setMenuSort] = useState(Sort.byName)
	const menuSorts = [
		{ name: "By name", value: Sort.byName } as SortCriteria,
		{ name: "By price", value: Sort.byPrice } as SortCriteria,
		{ name: "By rating", value: Sort.byRating } as SortCriteria,
	]

	const [adminPanelVisible, setAdminPanelVisible] = useState(false)
	const [addRestVisible, setAddRestVisible] = useState(false)
	const [addMenuItemVisible, setAddMenuItemVisible] = useState(false)
	const [addCourierVisible, setAddCourierVisible] = useState(false)

	useEffect(() => {
		if (user == undefined) {
			loadUser()

			return
		}

		if (chains.length == 0) {
			loadMoreChains()
		}

		if (oldOrders.length == 0) {
			loadOldOrders()
		}

	}, [user])

	async function logoutClick() {
		await signOut();
		setUser(undefined)
	}

	function loginClick() {
		console.log("LoginVisible: " + !loginVisible)
		setLoginVisible(!loginVisible)
	}

	async function loadUser(): Promise<User | undefined> {

		if (user != undefined) {
			console.log("Returning cached user.")
			return user
		}

		if (! await Session.doesSessionExist()) {
			console.log("User is not logged in.")
			return undefined
		}

		console.log("Session exists, will try to fetch user.")

		let userTokensId = await Session.getUserId()

		let userData = await getUserData(userTokensId)
		if (!userData) {
			return
		}

		setUser(userData)

		let roles = await getRoles(userData.email)
		setRoles(roles)
	}

	async function loadOldOrders(): Promise<void> {
		console.log("Loading old orders")
		let data = await loadWaitingOrders()
		setOldOrders(data)
		return
	}

	async function loadMoreChains(): Promise<void> {
		const newChains = await loadChains(chains.length, CHAINS_LOAD_COUNT, chainsSort)

		if (newChains.length < CHAINS_LOAD_COUNT) {
			setHasMoreChains(false)
		}

		setChains([...chains, ...newChains])

		return
	}

	function isAdmin(chain: string): boolean {
		return roles.some((r) => r.chainName == chain && r.role == "admin")
	}

	async function onChainClick(chain: Chain) {
		setSelChain(chain)
		const newItems = await loadMenuItems(chain.chainName,
			0, CHAINS_LOAD_COUNT, menuSort)

		setMenuItems(newItems)

		setAdminPanelVisible(isAdmin(chain.chainName))
	}

	function addToOrder(item: MenuItem) {
		if (selChain == undefined) {
			// sleChain: Chain | undefined, but undefined can't happen here.
			return
		}

		const newOrder = {
			chainName: selChain.chainName,
			menuItem: item
		} as OrderFromChain

		setOrders([...orders, newOrder])
	}

	function noDiscount(item: MenuItem): number {
		return item.price
	}

	async function loadMoreMenuItems(): Promise<void> {
		if (!selChain) {
			return
		}

		const fromInd = menuItems.length
		const count = ITEMS_LOAD_COUNT

		const newItems = await loadMenuItems(selChain?.chainName, fromInd, count, menuSort)

		if (newItems.length < ITEMS_LOAD_COUNT) {
			setHasMoreItems(false)
		}

		setMenuItems([...menuItems, ...newItems])

		return
	}

	function onRemoveItem(ind: number) {
		setOrders([...orders.slice(0, ind), ...orders.slice(ind + 1, undefined)])
	}

	function sumOrders(): OrderItem[] {
		const byChain: { [chain: string]: MenuItem[] } = {}

		for (var order of orders) {
			if (order.chainName in byChain) {
				byChain[order.chainName].push(order.menuItem)
			} else {
				byChain[order.chainName] = [order.menuItem]
			}
		}

		const chainCosts: { [chain: string]: number } = {}
		for (var key in byChain) {
			chainCosts[key] = byChain[key].reduce((sum, item) => sum + item.price, 0)
		}

		return Object.keys(chainCosts).map((chain) => {
			return {
				chain: chain,
				items: byChain[chain],
				total: chainCosts[chain],
				currency: byChain[chain][0].currency
				// ^ again assuming that all of the items are gonna have the
				// price in the sam currency.
			} as OrderItem
		})
	}

	function checkOutClick(sum: OrderItem) {
		setToCheckOut(sum)
		setCheckoutVisible(true)
	}

	async function processCheckout(sum: OrderItem,
		card: CardDetails,
		address: string): Promise<CheckoutResponse> {

		console.log("Processing checkout request")
		let res = await performCheckout(sum, card, address)

		if (isSuccess(res)) {
			loadOldOrders()
			// filter out ordered items
			setOrders(orders.filter((o) => !sum.items.includes(o.menuItem)))
		}

		return res
	}

	function groupCart(orders: OrderFromChain[]): OrderFromChain[] {
		var chains: { [chain: string]: OrderFromChain[] } = {}
		for (var order of orders) {
			if (order.chainName in chains) {
				chains[order.chainName].push(order)
			} else {
				chains[order.chainName] = [order]
			}
		}

		return Object.keys(chains).flatMap((val) => groupByItem(chains[val]))
	}

	function groupByItem(items: OrderFromChain[]): OrderFromChain[] {
		var grouped: { [item: string]: OrderFromChain[] } = {}

		for (var item of items) {
			if (item.menuItem.name in grouped) {
				grouped[item.menuItem.name].push(item)
			} else {
				grouped[item.menuItem.name] = [item]
			}
		}

		return Object.keys(grouped).flatMap((val) => grouped[val])
	}

	async function onChainsSort(value: Sort) {
		setChainsSort(value)
		setChains(await loadChains(0, chains.length, value))
	}

	function getComparator(s: Sort) {
		switch (s) {
			case Sort.byName:
				return (a: MenuItem, b: MenuItem) => a.name > b.name ? 1 : -1
			case Sort.byRating:
				return (a: MenuItem, b: MenuItem) => a.name > b.name ? 1 : -1
			case Sort.byPrice:
				return (a: MenuItem, b: MenuItem) => a.price > b.price ? 1 : -1
		}
	}

	async function onMenuItemsSort(value: Sort) {
		if (!selChain) return

		setMenuSort(value)

		let items = await loadMenuItems(selChain.chainName,
			0, menuItems.length,
			value)

		setMenuItems(items)
	}

	async function onItemUpdate(chain: string, itemName: string, desc: string,
		imgUrl: string, price: number, currency: string): Promise<boolean> {

		let itemUpdated = await updateMenuItem(chain, itemName, desc,
			imgUrl, price, currency)

		if (itemUpdated) {
			// Update the item that has been updated.
			let newItems = menuItems.map((i) => {
				if (i.name == itemName) {
					return {
						name: itemName,
						description: desc,
						imgUrl: imgUrl,
						price: price,
						currency: currency
					} as MenuItem
				}

				return i
			})

			setMenuItems(newItems)
		}

		return itemUpdated
	}

	async function onItemDelete(chain: string, itemName: string): Promise<boolean> {
		let itemDeleted = await deleteMenuItem(chain, itemName)

		if (itemDeleted) {
			setMenuItems(menuItems.filter((i) => i.name != itemName))
		}

		return itemDeleted
	}

	async function loadFoodRating(item: MenuItem): Promise<number> {
		if (!selChain) return -1 // will always be defined

		return getRating(selChain.chainName, item.name)
	}


	async function loadReviews(item: MenuItem, f: number, c: number): Promise<FoodReview[]> {
		if (!selChain) return []

		return getReviews(selChain.chainName, item.name, f, c)
	}

	async function checkIfCanComment(item: MenuItem): Promise<boolean> {
		if (!selChain) return false

		return getCanReview(selChain.chainName, item.name)
	}

	async function onPostReview(item: MenuItem, rating: number,
		comment: string): Promise<FoodReview | undefined> {

		if (!selChain) return

		return postReview(selChain.chainName, item.name, rating, comment)
	}

	function AdminButton({ text, onClick }: { text: string, onClick: () => void }) {
		return (<button className="flex
				px-2 mr-2
				border rounded-xl
				hover:bg-gray-400"
			onClick={onClick}>
			{text}</button>)
	}

	return (
		<div className="flex flex-col
				bg-slate-800
				text-white
				h-screen w-screen 
				max-h-screen
				items-center justify-start">

			{/* HEADER BAR */}
			<div className='flex flex-row 
				h-[40px] w-full
				py-2
				bg-gray-800
				items-center justify-center'>

				{user && <div className='mx-4'>{user.email} at {user.address}</div>}

				{
					user && <button className='text-red-700 px-2 
										border-2 border-red-700 rounded-lg
										hover:bg-red-950'
						onClick={logoutClick} >LOGOUT</button>
				}

				{!user && <button onClick={loginClick}>LOGIN</button>}

			</div>

			<div className='flex flex-row 
					py-4
					size-full
					items-center justify-evenly
					border-2 border-black'>

				{/* CHAINS */}
				<div className='flex flex-col 
						w-[450px] min-w-[450px] 
						h-full
						items-center justify-start'>

					{/* admin panel */}
					{adminPanelVisible &&
						<div className='flex flex-col 
							mb-2 py-2 px-4
							w-full h-[80px] min-h-[80px]
							border rounded-xl'>

							<p className='flex w-1/2 border-b'>Admin panel</p>

							<div className='flex flex-row
							w-full mt-2
							overflow-x-scroll'>

								<AdminButton text={"Restaurants"}
									onClick={() => { setAddRestVisible(true) }} />
								<AdminButton text={"Couriers"}
									onClick={() => { setAddCourierVisible(true) }} />
								<AdminButton text={"Menu Item"}
									onClick={() => { setAddMenuItemVisible(true) }} />
							</div>

						</div>
					}
					<div className='flex w-full h-full '>
						<Column
							title="Chains"
							sorts={chainsSorts}
							onSort={onChainsSort}
							loadMore={loadMoreChains}
							hasMore={hasMoreChains}>
							{
								chains.map((chain, index) =>
									<ChainPreview
										key={chain.chainName}
										chain={chain}
										onClick={onChainClick}
										selected={selChain?.chainName == chain.chainName} />
								)
							}
						</Column>
					</div>
				</div>

				{/* menu items */}
				<div className='flex
					w-[600px] min-w-[600px] h-full
					items-center justify-center'>

					<Column title="Menu"
						sorts={menuSorts}
						onSort={onMenuItemsSort}
						loadMore={loadMoreMenuItems}
						hasMore={hasMoreItems}>
						{
							menuItems.map((item, index) =>
								<div key={item.name}
									className='flex flex-col w-full items-center mt-2'>
									<MenuItemComponent item={item}
										discount={noDiscount}
										onOrder={addToOrder}
										loadItemRating={loadFoodRating}
										loadItemReviews={loadReviews}
										checkCanComment={checkIfCanComment}
										postReview={onPostReview} />
								</div>
							)
						}
					</Column>

				</div>

				{/* cart */}
				<div className='flex flex-col
					w-[450px] min-w-[450px] h-full
					rounded-xl px-2
					items-start'>

					<div className='flex w-full h-[400px] mb-2'>
						<Cart newOrders={sumOrders()}
							waitingOrders={oldOrders}
							onCheckout={checkOutClick} />
					</div>
					<Column title='Cart'
						sorts={undefined}
						onSort={(value) => { }}
						hasMore={false}
						loadMore={undefined}>
						{
							groupCart(orders).map((item, index) =>
								<div key={index} className='flex flex-col 
									w-full
									items-center mt-2'>
									<CartItem chainName={item.chainName}
										itemName={item.menuItem.name}
										price={item.menuItem.price}
										currency={item.menuItem.currency}
										onRemove={() => onRemoveItem(index)} />
								</div>)
						}

					</Column>
				</div>
			</div >

			<LoginPopup
				loginVisible={loginVisible}
				setLoginVisible={setLoginVisible} />

			<CheckoutPopup
				user={user}
				chainOrder={toCheckOut}
				isOpen={checkoutVisible}
				setIsOpen={setCheckoutVisible}
				onCheckout={processCheckout}
				openLogin={() => setLoginVisible(true)} />

			<AdminRestPopup
				chain={selChain?.chainName}
				isOpen={addRestVisible}
				setIsOpen={setAddRestVisible}
				onAdd={addRest}
				onUpdate={updateRest}
				onDelete={removeRest}
				getRest={getRestaurant} />

			<AdminCourierPopup
				chain={selChain?.chainName}
				isOpen={addCourierVisible}
				setIsOpen={setAddCourierVisible}
				loadRests={getRestaurants}
				loadCouriers={getCouriers}
				removeCourier={deleteCourier}
				onAdd={addCourier}
			/>

			<AdminMenuItemPopup
				chain={selChain?.chainName}
				isOpen={addMenuItemVisible}
				setIsOpen={setAddMenuItemVisible}
				onAdd={addMenuItem}
				loadItem={loadMenuItem}
				onUpdate={onItemUpdate}
				onRemove={onItemDelete}
			/>


		</div >
	);
}