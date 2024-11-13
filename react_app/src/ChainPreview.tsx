import { Chain } from "./datas"

export default function ChainPreview(
	{
		onClick,
		chain
	}: {
		onClick: (chain: Chain) => void,
		chain: Chain
	}

) {
	return (
		<div onClick={() => onClick(chain)}
			className='w-3/4
				mb-2
				items-center justify-center text-center
				border  rounded-xl
				hover:bg-gray-400'>

			{chain.chainName}
		</div>
	)
}