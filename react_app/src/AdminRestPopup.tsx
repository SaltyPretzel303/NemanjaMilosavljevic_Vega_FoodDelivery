import { useEffect, useState } from "react"
import { AddRestResponse, AddRestResponseType, Restaurant, User } from "./datas"
import Overlay from "react-modal"
import { findAllByAltText } from "@testing-library/react"

export default function AdminRestPopup(
	{
		chain,
		isOpen,
		setIsOpen,
		onAdd,
		onUpdate,
		onDelete,
		getRest
	}: {
		chain: string | undefined,
		isOpen: boolean,
		setIsOpen: React.Dispatch<boolean>,
		onAdd: (chain: string, name: string, address: string) => Promise<AddRestResponse>
		onUpdate: (chain: string, rest: string, address: string) => Promise<boolean>
		onDelete: (chain: string, rest: string) => Promise<boolean>
		getRest: (name: string) => Promise<Restaurant | undefined>
	}
) {

	const [name, setName] = useState("")
	const [address, setAddress] = useState("")
	const [err, setErr] = useState("")

	const [shouldUpdate, setShouldUpdate] = useState(false)

	useEffect(() => {
		if (isOpen) {
			setShouldUpdate(false)

			setName("")
			setAddress("")
			setErr("")
		}

	}, [isOpen])

	async function addClick() {
		if (!chain) return

		if (name == "" || address == "") {
			setErr("Please provide all values.")
			return
		}

		setErr("")
		let res = await onAdd(chain, name, address)
		switch (res.type) {
			case AddRestResponseType.SUCCESS:
				setIsOpen(false)
				break
			case AddRestResponseType.ALREADY_EXISTS:
				setErr("Already exists.")
				break
			case AddRestResponseType.FAILED:
				setErr("Failed ... ")
				break
		}
	}

	async function updateClick() {
		if (!chain) return

		let res = await onUpdate(chain, name, address)
		if (!res) {
			setErr("Failed to update restaurant. Please try again later.")
		} else {
			setIsOpen(false)
		}

	}

	async function deleteClick() {
		if (!chain) return

		let res = await onDelete(chain, name)
		if (!res) {
			setErr("Failed to delete restaurant. Please try again later.")
		} else {
			setIsOpen(false)
		}

	}

	async function nameInLostFocus() {
		if (name == "") return

		let rest = await getRest(name)
		if (rest) {
			setShouldUpdate(true)
			setAddress(rest.address)
		} else {
			setShouldUpdate(false)
			setAddress("")
		}
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
				w-[250px]
				border rounded-xl
				p-4 bg-gray-600
				items-center justify-center'>

				<p className='flex w-full justify-center border-b'>{chain}</p>

				<p>Restaurant name</p>
				<input type="text"
					onChange={(e) => setName(e.target.value)}
					onBlur={nameInLostFocus} />

				<p className='flex mt-4'>Address</p>
				<input type='text'
					value={address}
					onChange={(e) => setAddress(e.target.value)} />

				{!shouldUpdate && <button className='flex mt-4
								px-2
								hover:bg-gray-300
								border-2 border-blue-500 rounded-xl'
					onClick={addClick}>Add Restaurant</button>
				}


				{shouldUpdate &&
					<div className='flex flex-row 
						w-full
						items-center justify-center'>
						<button className='flex mt-4
									px-2 mx-2
									hover:bg-gray-300
									border border-yellow-400 rounded-xl'
							onClick={updateClick}>Update</button>

						<button className='flex mt-4
									px-2 mx-2
									hover:bg-gray-300
									border border-red-600 rounded-xl'
							onClick={deleteClick}>Delete</button>
					</div>
				}


				<p className='mt-2 text-red-500'>{err}</p>
			</div>

		</Overlay>
	)
}