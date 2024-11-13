import { OrderItem, CheckoutResponse } from "./datas";

export default function Cart(
	{
		waitingOrders,
		newOrders,
		onCheckout
	}: {
		waitingOrders: CheckoutResponse[],
		newOrders: OrderItem[],
		onCheckout: (sum: OrderItem) => void
	}
) {

	function cartValue() {
		return newOrders.reduce((s, item) => s + item.total, 0)
	}

	return (
		<div className='flex flex-col
				items-center
				size-full
				border-2 border-black rounded-xl'>

			<div className='flex flex-col 
					w-[90%] max-h-[200px] min-h-[200px]
					mt-2
					items-center justify-start
					border-y-2 border-black rounded-xl
					overflow-y-scroll'>
				{
					waitingOrders.map((ord, ind) =>
						<div className='flex flex-row 
							text-sm
							w-[95%]
							items-center justify-center
							px-2 m-2 
							hover:bg-gray-200 hover:bg-opacity-40
							border border-green-500 rounded-xl'
							key={ind}>

							<p className='flex w-3/4'>
								{ord.orderId}: {ord.restaurant} |{ord.deliveryTime}|
							</p>
							<p>Waiting ... </p>
						</div>
					)
				}
				{
					newOrders.map((order, index) =>

						<div className='flex flex-row 
							w-[95%]
							items-center justify-center
							p-2 m-2 
							hover:bg-gray-200 hover:bg-opacity-40
							border border-yellow-700 rounded-xl'
							key={index}>

							<p className='flex w-4/5'>
								{order.chain}: {order.total}</p>

							<button className='flex 
											px-2 
											justify-center mx-4 
											border rounded-xl
											hover:bg-blue-300
											min-w-fit'
								onClick={() => onCheckout(order)}>
								Checkout
							</button>
						</div>)
				}
			</div>
			<div className='flex w-3/4 
					justify-center 
					pt-2 my-2'>
				TOTAL: {cartValue()}</div>

		</div>
	)
}