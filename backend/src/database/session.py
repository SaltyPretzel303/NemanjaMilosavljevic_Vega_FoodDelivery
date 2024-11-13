from typing import AsyncGenerator
from sqlalchemy.orm import Session

from sqlalchemy import Engine, create_engine

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import AppConfig
from src.database.models import Base

engine:Engine = None
sessionFactory = None

async def gen_session() -> AsyncGenerator[Session, None]: 
	global engine
	if engine is None: 
		await create_engine()

	async with sessionFactory() as session: 
		yield session
	
async def get_session_factory() -> async_sessionmaker[AsyncSession]: 
	global engine
	global sessionFactory

	if engine is None: 
		await create_engine()

	return sessionFactory

# Engine will be created on FastApi startup (or whatever lib is used).
async def create_engine(): 
	global engine
	global sessionFactory

	print("Will create/initialize engine.")

	db_url = f"sqlite+aiosqlite:///{AppConfig.instance().db_path}"
	engine = create_async_engine(db_url, connect_args={"check_same_thread": False})
		
	# This could be moved to some migration script. 
	async with engine.begin() as conn: 
		# await conn.run_sync(Base.metadata.drop_all)
		await conn.run_sync(Base.metadata.create_all)

	sessionFactory = async_sessionmaker(autoflush=False, 
								expire_on_commit=False, 
								bind=engine)
	