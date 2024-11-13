import { useState } from "react"
import { Sort } from "./datas"

export interface SortCriteria {
	name: string
	value: Sort
}

export function Column(
	{
		title,
		children,
		loadMore,
		hasMore,
		sorts,
		onSort
	}: {
		title: string,
		children: React.ReactNode,
		loadMore: (() => Promise<void>) | undefined,
		hasMore: boolean,
		sorts: SortCriteria[] | undefined,
		onSort: (value: Sort) => void
	}

) {

	const [sortInd, setSortInd] = useState(0)

	return (
		<div className='flex flex-col 
				size-full px-2
				items-center justify-start
				border-2 border-orange-400 rounded-xl'>

			<div className='flex w-2/3 h-[30px]
				text-2xl justify-center'>
				{title}</div>

			{sorts &&
				<div className='flex flex-row 
				h-[30px] w-full mt-4
				overflow-x-scroll'>
					<p className='flex mx-2'>Sort: </p>
					{
						sorts.map((s, ind) =>
							<button key={ind}
								onClick={() => {
									setSortInd(ind)
									onSort(s.value)
								}}
								className={`flex 
									px-2 mx-1
									hover:bg-slate-400
									rounded-xl ${ind == sortInd ? 'border border-orange-400' : ''}`
								}>{s.name}</button>
						)
					}
				</div>
			}
			<div className='flex flex-col 
				size-full
				items-center justify-end
				m-2 p-2'>

				<div className="flex flex-col 
					w-full h-full px-2
					items-center
					border-y-2 border-black rounded-xl 
					overflow-scroll">

					{children}

				</div>

				{loadMore && <button className='flex justify-center 
					h-[30px]
					mt-2 px-2
					border-2 border-orange-400 rounded-xl
					hover:bg-orange-400'
					disabled={!hasMore}
					onClick={loadMore}>

					Load More
				</button>}
			</div>

		</div>
	)
}