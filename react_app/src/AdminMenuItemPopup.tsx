import { useEffect, useState } from "react"
import { AddItemResponse, AddItemResponseType, MenuItem, User } from "./datas"
import Overlay from "react-modal"
import { isPostfixUnaryExpression } from "typescript"

export default function AdminMenuItemPopup(
	{
		chain,
		isOpen,
		setIsOpen,
		onAdd,
		loadItem,
		onUpdate,
		onRemove
	}: {
		chain: string | undefined,
		isOpen: boolean,
		setIsOpen: React.Dispatch<boolean>,
		onAdd: (chain: string, name: string, desc: string, price: number,
			currency: string, simgUrl: string) => Promise<AddItemResponse>,
		loadItem: (chain: string, itemName: string) => Promise<MenuItem | undefined>
		onUpdate: (chain: string, itemName: string, desc: string,
			imgUrl: string, price: number, currency: string) => Promise<boolean>
		onRemove: (chain: string, itemName: string) => Promise<boolean>
	}
) {

	useEffect(() => {
		if (!chain) return
	}, [])

	const currencies = ["RSD"]

	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [imgUrl, setImgUrl] = useState("")
	const [price, setPrice] = useState(0)
	const [currency, setCurrency] = useState(currencies[0])
	const [err, setErr] = useState("")

	const [canUpdate, setCanUpdate] = useState(false)

	useEffect(() => {
		if (isOpen) {
			clearFields()
		}
	}, [isOpen])

	async function addClick() {

		if (!chain) return

		if (name == "" || description == "" || imgUrl == "" || price == 0) {
			console.log(name + name == "")
			console.log(description + description == "")
			console.log(imgUrl + imgUrl == "")
			console.log(price == 0)

			setErr("Please provide all values.")
			return
		}

		setErr("")
		let res = await onAdd(chain, name, description, price, currency, imgUrl)
		switch (res.type) {
			case AddItemResponseType.SUCCESS:
				setIsOpen(false)
				break
			case AddItemResponseType.ALREADY_EXISTS:
				setErr("Already on menu.")
				break
			case AddItemResponseType.FAILED:
				setErr("Failed ... ")
				break
		}
	}

	function clearFields() {
		setCanUpdate(false)

		setName("")
		setDescription("")
		setImgUrl("")
		setPrice(0)

		setErr('')
	}

	async function onLeftNameInput() {
		if (!chain || name == "") return

		let item = await loadItem(chain, name)

		if (item) {
			setCanUpdate(true)

			setName(item.name)
			setDescription(item.description)
			setImgUrl(item.imgUrl)
			setPrice(item.price)
			setCurrency(item.currency)
		} else {
			// It IS the same as clear files methods, with the difference that
			// this time we are leaving name field 
			setCanUpdate(false)

			setDescription("")
			setImgUrl("")
			setPrice(0)

			setErr('')
		}
	}

	async function updateClick() {
		if (!chain) return

		let itemUpdated = await onUpdate(chain, name, description,
			imgUrl, price, currency)

		if (itemUpdated) {
			setIsOpen(false)
		} else {
			setErr("Failed to update item. Please try again later.")
		}

	}

	async function deleteClick() {
		if (!chain) return

		let isDeleted = await onRemove(chain, name)

		if (isDeleted) {
			setIsOpen(false)
		} else {
			setErr("Failed to delete the item. Please try again later.")
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

				<p>Item name</p>
				<input type="text"
					onChange={(e) => setName(e.target.value)}
					onBlur={onLeftNameInput} />

				<p className='flex mt-4'>Description</p>
				<input type='text'
					value={description}
					onChange={(e) => setDescription(e.target.value)} />

				<p className='flex mt-4'>Image url</p>
				<input type='text'
					value={imgUrl}
					onChange={(e) => setImgUrl(e.target.value)} />

				<p className='flex mt-4'>Price</p>
				<div className='flex flex-row
					items-center justify-center
					p-1 w-full'>

					<input className='flex w-[100px]' type='number'
						value={price}
						onChange={(e) => {
							if (Number(e.target.value)) {
								setPrice(Number(e.target.value))
							} else {
								setPrice(0)
							}
						}} />
					<select className='flex ml-2 rounded-xl px-2 py-1'
						defaultValue={currencies[0]}
						onChange={(e) => setCurrency(e.target.value)}>
						{
							currencies.map((c) =>
								<option
									key={c}
									value={c}>
									{c}
								</option>)
						}
					</select>
				</div>

				{!canUpdate && <button className='flex mt-4
					px-2
					hover:bg-gray-300
					border rounded-xl'
					onClick={addClick}>

					Add Item</button>}

				{canUpdate &&
					<div className='flex flex-row
								mt-4
								items-center justify-center'>
						<button className='px-2 mx-2
										border border-yellow-600
										hover:bg-gray-400
										rounded-xl'
							onClick={updateClick}>Update</button>

						<button className='px-2 mx-2
										border border-red-600
										hover:bg-gray-400
										rounded-xl'
							onClick={deleteClick}>Delete</button>
					</div>}


				<p className='mt-2 text-red-500'>{err}</p>
			</div>

		</Overlay>
	)
}