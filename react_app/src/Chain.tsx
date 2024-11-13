import { useEffect, useState } from "react";
import { Chain, MenuItem, Restaurant } from "./datas";
import MenuItemComponent from "./MenuItemComponent";

export default function ChainComponent(
	{
		chain,
		// getRestaurants,
		getMenuItems,
		orderItem
	}: {
		chain: Chain,
		// getRestaurants: (f: number, cnt: number) => Promise<Restaurant[]>,
		getMenuItems: (f: number, cnt: number) => Promise<MenuItem[]>,
		orderItem: (item: MenuItem) => void
	}
) {

	const SINGLE_LOAD = 3

	const [items, setItems] = useState<MenuItem[]>([])
	const [hasMore, setHasMore] = useState(true)

	useEffect(() => {
		loadMore()
	}, [])

	async function loadMore() {
		const newItems = await getMenuItems(items.length, SINGLE_LOAD)
		setItems([...items, ...newItems])

		if (newItems.length < SINGLE_LOAD) {
			setHasMore(false)
		}
	}

	function noDiscount(item: MenuItem): number {
		return item.price
	}

	return (
		<div className='flex flex-col 
				items-center 
				size-full '>

			<div className='text-blue-500 text-2xl'>{chain.chainName}</div>
			<div className='flex flex-col overflow-scroll'>
				{
					items.map((item, index) =>
						<div key={index} className='w-full
									border-2 border-yellow-500
									mb-2'>

							<MenuItemComponent
								item={item}
								onOrder={orderItem}
								discount={noDiscount} />
						</div>)
				}
				<button className='m-4 text-xl border-2 border-black'
					onClick={loadMore}
					disabled={!hasMore}
				>More items</button>
			</div>
		</div>
	)
}
