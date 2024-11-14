import { useContext, useEffect, useState } from "react"
import { CardDetails, OrderItem, MenuItem, CheckoutResponse, CheckoutResponseType, User, isSuccess } from "./datas"
import Overlay from 'react-modal'

export default function CheckoutPopup(
	{
		user,
		openLogin,
		chainOrder,
		onCheckout,
		isOpen,
		setIsOpen
	}: {
		user: User | undefined
		openLogin: () => void,
		chainOrder: OrderItem | undefined,
		onCheckout: (sum: OrderItem, card: CardDetails, address: string) => Promise<CheckoutResponse>,
		isOpen: boolean,
		setIsOpen: React.Dispatch<boolean>
	}
) {

	useEffect(() => {
		setCheckoutResp(undefined)
	}, [isOpen])

	// useEffect(() => {
	// 	if (!chainOrder) return

	// 	if (!chainOrder.response || !isSuccess(chainOrder.response)) {
	// 		// let the user try again 
	// 		setCheckoutResp(undefined)
	// 	}

	// }, [isOpen])

	const [cardDetails, setCardDetails] = useState("")
	const [checkoutResp, setCheckoutResp] = useState<CheckoutResponse | undefined>()

	async function checkoutClick() {
		if (!chainOrder) return

		if (user == undefined) {
			openLogin()
			return
		}

		const resp = await onCheckout(chainOrder,
			{ data: cardDetails } as CardDetails,
			user.address)

		setCheckoutResp(resp)
	}

	function formatTime(sTime: string): string {

		return new Date(sTime).toLocaleString()
	}

	function ResponseRender({ response }: { response: CheckoutResponse | undefined }) {
		if (!response) {
			return <div></div>
		}
		switch (response.responseType) {
			case CheckoutResponseType.SUCCESS:
				return (
					<div className='flex flex-col border-2
						p-2 
						border-green-600 mt-4
						rounded-xl'>

						<div>Order processed by: {response.restaurant}</div>
						<div>Courier: {response.courier}</div>
						<div>Delivery expected at: {formatTime(response.deliveryTime)} </div>

					</div>)
			case CheckoutResponseType.INVALID_CARD:
				return <div>Invalid card details. Please try again.</div>
			case CheckoutResponseType.TOO_BUSY:
				return <div>This restaurant chain is currently too busy. Please try again later.</div>
			case CheckoutResponseType.FAILED:
				return <div>Order failed. Please try again later.</div>
		}
	}

	function orderAccepted() {
		return checkoutResp && isSuccess(checkoutResp)
	}

	return (
		<Overlay
			ariaHideApp={false}
			isOpen={isOpen}
			shouldCloseOnEsc={true}
			shouldCloseOnOverlayClick={true}
			onRequestClose={() => setIsOpen(false)}
			className='flex items-center justify-center 
					size-full
					bg-gray-500 bg-opacity-50'>

			<div className="flex flex-col 
					w-1/4 h-1/4
					items-center justify-center 
					bg-white opacity-100
					border-2 rounded-xl
					size-full">

				<div>{chainOrder?.chain}</div>

				{/* Assuming that all of the items are gonna have the price in 
					the same currency and since there is a checkout there has to 
					be at least one item in the cart. */}
				<div>{chainOrder?.total} {chainOrder?.items[0].currency}</div>

				<div> Card details</div>
				<input className="flex bg-gray-300 w-[300px]"
					type="text"
					onChange={(e) => setCardDetails(e.target.value)} />

				<button className={`mt-2 border 
						border-black rounded-xl px-2
						hover:bg-gray-400
						${orderAccepted() ? "border-green-500 hover:bg-white" : ""}`}
					onClick={checkoutClick}
					disabled={orderAccepted()}
				>

					CHECKOUT
				</button>

				<ResponseRender response={checkoutResp} />
				{/* {
					checkoutResp && checkoutResp.responseType == CheckoutResponseType.SUCCESS &&
					<div className='flex flex-col border-2
						 border-green-600 mt-4'>

						<div>Your oreder is processed by the: {checkoutResp?.restaurant}</div>
						<div>Your courier is: {checkoutResp?.courier}</div>
						<div>Expect delivery at: {checkoutResp.deliveryTime} </div>

					</div>
				}
				{
					checkoutResp && checkoutResp.responseType == CheckoutResponseType.INVALID_CARD &&
					<div>Invalid card details. Please try again.</div>
				}
				{
					checkoutResp && checkoutResp.responseType == CheckoutResponseType.TOO_BUSY &&
					<div>This restaurant chain is currently too busy. Please try again later.</div>
				}
				{
					checkoutResp && checkoutResp.responseType == CheckoutResponseType.FAILED &&
					<div>Order failed. Please try again later.</div>
				} */}

			</div>

		</Overlay >
	)
}