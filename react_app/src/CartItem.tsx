export default function CartItem(
	{
		itemName,
		chainName,
		price,
		currency,
		onRemove
	}: {
		itemName: string,
		chainName: string,
		price: number,
		currency: string,
		onRemove: () => void
	}

) {
	return (
		<div className='flex flex-row 
			size-full
			items-center justify-start'>

			<div className='flex flex-col
				w-full
				p-2
				items-start overflow-clip
				border-2 rounded-xl '>
					
				<p className='text-2xl truncate ...'>
					{itemName}
				</p>

				<div className='text-sm'>from: {chainName}</div>
				<div>{price} {currency}</div>
			</div>

			<div className='flex flex-row items-center justify-start w-[50px]'>
				<button className='flex 
						border-y-2 border-r-2 
						rounded-r-full
						justify-center
						hover:bg-red-600 hover:bg-opacity-50
						text-xl text-red-700
						px-4'
					onClick={onRemove}>
					X
				</button>
			</div>


		</div>
	)
}