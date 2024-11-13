import { useEffect, useState } from "react"
import { AddCourierResponse, AddCourierResponseType, Courier, Restaurant } from "./datas"
import Overlay from "react-modal"

export default function AdminCourierPopup(
	{
		chain,
		isOpen,
		setIsOpen,
		onAdd,
		loadRests,
		loadCouriers,
		removeCourier
	}: {
		chain: string | undefined,
		isOpen: boolean,
		setIsOpen: React.Dispatch<boolean>,
		onAdd: (chain: string, mail: string, rest: string) => Promise<AddCourierResponse>,
		loadRests: (chain: string) => Promise<Restaurant[]>,
		loadCouriers: (rest: string) => Promise<Courier[]>,
		removeCourier: (rest: string, courier: string) => Promise<boolean>
	}
) {

	useEffect(() => {
		if (isOpen) {
			populateRests()
			setErr("")
		}

	}, [isOpen])

	const [email, setEmail] = useState("")
	const [rests, setRests] = useState<Restaurant[]>([])
	const [selRest, setSelRes] = useState<Restaurant | undefined>(undefined)

	const [couriers, setCouriers] = useState<Courier[]>([])

	const [err, setErr] = useState("")

	async function populateRests(): Promise<void> {
		if (!chain) return

		setRests(await loadRests(chain))
	}

	async function addClick() {

		if (!chain) return

		if (email == "") {
			setErr("Please provide courier email.")
			return
		}

		if (!selRest) {
			setErr("Please select restauran.")
			return
		}

		setErr("")
		let res = await onAdd(chain, email, selRest.name)
		switch (res.type) {
			case AddCourierResponseType.SUCCESS:
				setIsOpen(false)
				break
			case AddCourierResponseType.NO_SUCH_USER:
				setErr("No such user.")
				break
			case AddCourierResponseType.COURIER_OCCUPIED:
				setErr("Currier currently occupied. Try again later.")
				break
			case AddCourierResponseType.FAILED:
				setErr("Failed ... ")
				break
		}
	}

	async function restClick(rest: Restaurant) {
		setSelRes(rest)

		let cs = await loadCouriers(rest.name)
		setCouriers(cs)
	}

	async function removeCourierClick(courier: Courier) {
		if (!selRest) return

		let isRemoved = await removeCourier(selRest.name, courier.email)

		if (isRemoved) {
			setCouriers(couriers.filter((c) => c.email != courier.email))
		} else {
			setErr("Failed to remove courier.")
		}

		return
	}

	function RestPreview({
		name,
		address,
		selected,
		onClick
	}: {
		name: string,
		address: string,
		selected: boolean,
		onClick: () => void
	}) {
		return (
			<div className={`flex flex-col
				px-2 mb-2
				border border-black rounded-xl
				hover:bg-gray-500
				${selected ? "border-orange-400" : ""}`}
				onClick={onClick}>
				<p className='text-xl'>{name}</p>
				<p>Address: {address}</p>
			</div >
		)
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

			<div className='flex flex-col
				w-[400px]
				border rounded-xl
				p-4 bg-gray-600
				items-center justify-center'>

				<p className='flex w-2/3 justify-center border-b'>{chain}</p>

				<p className='mt-4'>Restaurants</p>
				<div className='flex flex-col
					w-full max-h-[300px]
					p-2 mb-4
					border-y rounded-b-xl rounded-t-xl
					overflow-scroll
					'>
					{
						rests.map((r, ind) =>
							<RestPreview
								key={r.name}
								name={r.name}
								address={r.address}
								selected={r.name == selRest?.name}
								onClick={() => restClick(r)} />)
					}
				</div>
				<p>Couriers</p>
				<div className='flex flex-col
							w-full max-h-[100px] min-h-[40px]
							overflow-scroll
							p-2 mb-4
							border-y rounded-b-xl rounded-t-xl'>
					{
						couriers.map((c) =>
							<div key={c.email} 
								className='flex flex-row
								w-full h-[30px]'>

								<p className='flex w-full 
									px-2 
									border 
									rounded-l-xl'>{c.email}</p>
								<button className='flex justify-center
											w-[1/4] px-2
											border
											rounded-r-xl
											text-red-400
											hover:bg-red-800'
									onClick={() => removeCourierClick(c)}>X</button>
							</div>)
					}
				</div>

				<p>Courier email</p>
				<input type="text" onChange={(e) => setEmail(e.target.value)} />


				<button className='flex mt-4
					px-2
					hover:bg-gray-300
					border rounded-xl'
					onClick={addClick}>

					Add Courier</button>

				<p className='mt-2 text-red-500'>{err}</p>
			</div>

		</Overlay >
	)
}