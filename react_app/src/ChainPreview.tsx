import { Chain } from "./datas"

export default function ChainPreview(
	{
		onClick,
		chain,
		selected
	}: {
		onClick: (chain: Chain) => void,
		chain: Chain,
		selected: boolean
	}

) {
	return (
		<div onClick={() => onClick(chain)}
			className={`flex flex-col
				w-full h-[100px] min-h-[100px]
				mb-2 p-2
				items-start justify-center
				border-2
				${selected ? 'border-orange-400' : ""}
				rounded-xl
				hover:bg-gray-400 hover:bg-opacity-20`}>

			<p className='text-xl text-orange-400'>{chain.chainName}</p>
			<div className='flex w-1/3 border-b mb-4'></div>

			<p>{chain.description}</p>
		</div>
	)
}