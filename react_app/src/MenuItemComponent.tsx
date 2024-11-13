import { MenuItem } from "./datas";

export default function MenuItemComponent(
	{
		item,
		onOrder,
		discount
	}: {
		item: MenuItem,
		onOrder: (item: MenuItem) => void,
		discount: (item: MenuItem) => number
	}) {
	return (
		<div className='flex flex-col 
				w-full h-[250px]
				items-center
				border-2 rounded-xl'>

			<div className='text-2xl text-orange-700'>{item.name}</div>
			<img src={item.imgUrl} className='flex w-[100px] h-[100px]'></img>
			<div>{item.description}</div>
			<div>{discount(item)} {item.currency}</div>

			<div className='flex w-3/4 h-[2px] border border-black'></div>

			<button className='flex m-2 
				px-4 py-1 bg-gray-400 rounded-xl
				border border-transparent
				hover:border hover:bg-slate-200'
				onClick={() => onOrder(item)}>Add to cart</button>
		</div>
	)
}