
from typing import Any, Dict, List
from supertokens_python.types import GeneralErrorResponse
from supertokens_python import InputAppInfo, SupertokensConfig, init, get_all_cors_headers
from supertokens_python.framework.fastapi import get_middleware as get_fast_api_middleware
from supertokens_python.recipe import emailpassword, session, usermetadata
from supertokens_python.recipe.emailpassword.types import FormField
from supertokens_python.recipe.emailpassword.interfaces import APIInterface, APIOptions
from supertokens_python.recipe.emailpassword.interfaces import SignUpPostOkResult
from supertokens_python.recipe.emailpassword import InputFormField
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.asyncio import delete_user


from src.database.models import Role
from src.database.session import gen_session, get_session_factory
import src.database.db as crud

import src.model.mapper as mapper
from src.model.models import RoleRequest, Role, User

from fastapi import APIRouter, Depends, FastAPI, HTTPException, status

from src.config import AppConfig


config = AppConfig.instance()

def override_default_emailpassword(defaultImp: APIInterface)->APIInterface: 

	default_sign_up = defaultImp.sign_up_post

	# With this method we can extend the custom signUp logic. Notify/trigger some
	# external services or just create the separate user model that can hold
	# more info about the users (but still be connected with the user id created
	# by the supertokens platform). This way we are not locked with one auth
	# implementation.  
	async def custom_sign_up(form_fields: List[FormField],
						tenant_id: str, 
						api_options: APIOptions, 
						user_context: Dict[str, Any]):


		print("Processing extended supertoken signUp request.")

		address_field = next(filter(lambda f: f.id == "address", form_fields), None)
		if address_field is None: 
			print("Address not provided")

			return GeneralErrorResponse(message="Address not provided.")

		# Some addres validation ... 

		result = await default_sign_up(form_fields, 
								tenant_id, 
								api_options, 
								user_context)
		
		if not isinstance(result, SignUpPostOkResult):
			print(f"Signup failed with: {result.status}")	
			return result

		session = None
		try: 

			session_factory = await get_session_factory()
			session = session_factory()

			# TODO  do some geolocation on address or something
			long = 10
			lat = 20
			user = await crud.add_user(session, result.user.user_id, 
							result.user.email, address_field.value,
							long, lat)
			
		except Exception as e: 
			print(f"Caught: {e} while adding new user.")
			await delete_user(result.user.user_id)
		finally: 
			if session is not None: 
				await session.close()
		
		return result

	defaultImp.sign_up_post = custom_sign_up

	return defaultImp

# Supertokens is gonna be used for authentication and authorization. 
init(
	app_info=InputAppInfo(
		app_name="react_app",
		# Has to mach the value passed to the init method on the frontend. 

		# Has to be exact domain name, can't be patterns (can't start with .) 
		# like the cookie_domain.
		# Domain name of the service exposing auth api.
		# https://supertokens.com/docs/emailpassword/common-customizations/sessions/multiple-api-endpoints
		api_domain=f"http://localhost:8080",
		api_base_path="/auth",
		website_domain=f"http://localhost:3000",
		website_base_path="/"
	),
	supertokens_config=SupertokensConfig(
		connection_uri=f"http://tokens-core.vega:3567",
	),
	framework='fastapi',
	mode='wsgi', # required for uvicorn
	recipe_list=[
		emailpassword.init(
			sign_up_feature=emailpassword.InputSignUpFeature(
				form_fields = [InputFormField(id='address')]
			),
			override=emailpassword.InputOverrideConfig(
				apis=override_default_emailpassword
			)
		),
		session.init(
			cookie_domain=f'.localhost:3000',
		)
	],
)


app = APIRouter()

@app.get("/user")
async def get_user(tokens_id: str, s = Depends(gen_session)):
	print("Processing get user request.")

	user = await crud.get_user_by_token(s, tokens_id)
	if user is None: 
		print("No such user or invalid token.")
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
					  detail= "No such user (invalid token).")
	
	return mapper.as_user(user)

# TESTING
@app.get("/remove/{email}")
async def remove_user(email: str, s = Depends(gen_session)):
	user = await crud.get_user_by_email(s, email)
	if user is None: 
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
					  detail="No such user.")
	
	await delete_user(user.tokens_id)
	await crud.remove_user(s, email)

# No authentication required only the root key inside the data obj.
@app.post("/role")
async def add_role(data: RoleRequest, s = Depends(gen_session)):
	
	if not valid_root_key(data.rootKey): 
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
					detail="Please provie a valid secret root key.")

	res_role = await crud.add_role(s, data.role.userEmail, 
							data.role.chainName, 
							data.role.role)

	if res_role[0] is None: 
		raise HTTPException(status_code=status.HTTP_409_CONFLICT,
					detail=res_role[1])
	
	return mapper.as_role(res_role[0])
	
@app.delete("/roles")
async def del_role(data: RoleRequest, s = Depends(gen_session)): 

	if not valid_root_key(data.rootKey): 
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 	
						detail="Please provie a valid secret root key.")

	del_res = await crud.remove_role(s, data.role.userEmail, 
								data.role.chainName, 
								data.role.role)

	if not del_res: 
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
					detail="No such role.")
	
	return data.role

@app.get("/roles", response_model=List[Role])
async def get_roles(user_email:str, s = Depends(gen_session)):
	roles = await crud.get_roles_by_mail(s, user_email)

	if roles[0] is None: 
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, 
					  detail=roles[1])
	
	return [mapper.as_role(db_role) for db_role in roles[0]]

def valid_root_key(key: str): 
	return True
