import setuptools

setuptools.setup(
	name="vega_delivery",
	install_requires=[
				'supertokens-python',
				'fastapi',
				'jsonpickle',
				'requests',
				'requests-file',
				'uvicorn',
				'sqlalchemy[asyncio]',
				'aiosqlite'
			],
	zip_safe=False
)
				