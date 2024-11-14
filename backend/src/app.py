from typing import Any, Dict, List
from fastapi import FastAPI

# from fastapi_async_sqlalchemy import SQLAlchemyMiddleware, db

from src.database.models import Base
from src.database.session import create_engine

from supertokens_python import InputAppInfo, SupertokensConfig, init, get_all_cors_headers
from supertokens_python.framework.fastapi import get_middleware as get_fast_api_middleware
from supertokens_python.recipe import emailpassword, session, usermetadata
from supertokens_python.recipe.emailpassword.types import FormField
from supertokens_python.recipe.emailpassword.interfaces import APIInterface, APIOptions
from supertokens_python.recipe.emailpassword.interfaces import SignUpPostOkResult
from starlette.middleware.cors import CORSMiddleware

import uvicorn

from src.api.crud_api import app as crud_router
from src.api.auth_api import app as auth_router
from src.config import AppConfig

config = AppConfig.instance()

async def app_lifespan(app: FastAPI): 
	print("starting fastapi app")

	await create_engine()

	print("Engine initialize")

	yield

	print("Shutind down fastapi app")

app = FastAPI(lifespan=app_lifespan)
app.add_middleware(get_fast_api_middleware())

app.add_middleware(
	CORSMiddleware,
	allow_origins=[f"http://localhost:3000"],
	# allow_origins=[f"http://web.vega:3000"],
	# allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "cookies"] + get_all_cors_headers(),
)


app.include_router(crud_router)
app.include_router(auth_router)

if __name__ == "__main__":
	config = AppConfig.instance()
	uvicorn.run("app:app", host="0.0.0.0", port=config.port)