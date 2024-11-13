import { useEffect, useState } from "react";
import { FoodReview, MenuItem } from "./datas";
import ReactStars from 'react-stars'

export default function MenuItemComponent(
	{
		item,
		onOrder,
		discount,
		loadItemRating,
		loadItemReviews,
		checkCanComment,
		postReview
	}: {
		item: MenuItem,
		onOrder: (item: MenuItem) => void,
		discount: (item: MenuItem) => number,
		loadItemRating: (item: MenuItem) => Promise<number>
		loadItemReviews: (item: MenuItem,
			fromInd: number,
			count: number) => Promise<FoodReview[]>,
		checkCanComment: (item: MenuItem) => Promise<boolean>,
		postReview: (item: MenuItem, rating: number,
			comment: string) => Promise<FoodReview | undefined>
	}) {

	const [ratingValue, setRatingValue] = useState(0)
	const [reviews, setReviews] = useState<FoodReview[]>([])

	const [canComment, setCanComment] = useState(false)
	const [starsValue, setStarsValue] = useState(0)
	const [comment, setComment] = useState("")

	const [hasMoreReviews, setHasMoreReviews] = useState(true)

	const [err, setErr] = useState("")

	useEffect(() => {
		if (!item) return

		setErr("")

		loadRating()
		loadReviews()
		checkIfCanComment()

		setHasMoreReviews(true)

	}, [])

	async function loadRating() {
		let rating = await loadItemRating(item)
		setRatingValue(rating)
	}

	async function loadReviews() {
		setReviews(await loadItemReviews(item, 0, 1))
	}

	async function checkIfCanComment() {
		setCanComment(await checkCanComment(item))
	}

	async function onPostReviewClick() {
		if (starsValue == 0) {
			setErr("Please provide rating")
			return
		}

		if (comment == "") {
			setErr("Please provide comment")
			return
		}

		let review = await postReview(item, starsValue, comment)

		if (review) {
			setCanComment(false)

			if (reviews.length > 1) {
				setReviews([review, ...reviews])
			}
		} else {
			setErr("Failed to post.")
		}

	}

	async function loadMoreReviews() {
		let from = reviews.length
		let count = 3
		let newRevs = await loadItemReviews(item, from, count)

		setReviews([...reviews, ...newRevs])

		if (newRevs.length < count) {
			setHasMoreReviews(false)
		}

	}

	return (
		<div className='flex flex-col 
				w-full
				items-center
				border-2 rounded-xl'>

			<div className='flex flex-row 
				w-full'>

				<div className='flex flex-col 
					w-1/3
					py-2
					items-center justify-start'>

					<div className='flex w-3/4
						text-center
						items-center justify-center
						text-xl 
						text-orange-700'>{item.name}</div>

					<ReactStars size={24} edit={false} value={ratingValue} />

					<p className='w-full h-[90px] max-h-[300px]
						px-1
						text-sm text-center
						overflow-x-clip overflow-y-scroll
						text-wrap'>
						{item.description}</p>

				</div>

				<img src={item.imgUrl}
					className='flex 
						h-[170px] w-[210px]
						my-2
						border-2 border-orange-400 rounded-xl' />

				<div className='flex flex-col 
							items-center justify-center'>

					<button className='flex 
								m-2 px-4 py-1 
								rounded-xl
								border 
								hover:border hover:bg-slate-500'
						onClick={() => onOrder(item)}>Add to cart</button>

					<p className='text-orange-300'>{discount(item)} {item.currency}</p>
				</div>

			</div>

			{/* <div className='flex w-3/4 h-[2px] border border-black'></div> */}


			{
				canComment &&
				<div className='flex flex-col
						w-3/4
						px-4
						items-center
						border rounded-xl'>
					<p>Leave a review (I saw you ordering ...)</p>
					<ReactStars size={30}
						value={starsValue}
						onChange={(r) => setStarsValue(r)} />
					<input className='w-full text-black'
						type="text"
						onChange={(e) => setComment(e.target.value)}
					/>
					<button className='px-2 my-2
						border border-orange-400 rounded-xl
						hover:bg-gray-400'
						onClick={onPostReviewClick}>
						Post</button>
				</div>
			}

			{reviews.length > 0 &&
				<div className='flex flex-col 
						max-h-[300px] w-[90%]
						mb-2
						
						items-center justify-center'>

					<div className='flex flex-col 
						w-full
						overflow-scroll'>
						{
							reviews.map((r, ind) =>
								<div key={ind}
									className='flex flex-col
										min-h-[100px]
										w-full p-2 my-2
										border rounded-xl'>

									<p className='border-y rounded-xl
										px-2 mb-2
										max-h-[60px] 
										overflow-y-scroll
										overflow-x-hidden
										text-wrap'>
										{r.comment}</p>
									<ReactStars value={r.rating} edit={false} />
									<p>by: {r.userEmail}</p>
								</div>
							)
						}

					</div>
					<button className='px-2 
						border rounded-xl
						my-2
						hover:bg-gray-400'
						onClick={loadMoreReviews}
						disabled={!hasMoreReviews}
					>More reviews</button>
				</div>
			}

			<p>{err}</p>
		</div>
	)
}