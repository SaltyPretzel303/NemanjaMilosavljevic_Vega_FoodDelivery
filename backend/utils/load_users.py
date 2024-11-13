from dataclasses import dataclass
from requests import post

signup_url = "http://localhost:8080/auth/signup"
signup_header = {"rid": "emailpassword"}

def get_signup_data(email, password, address):
	return {
		"formFields": 
			[
				{
					"id": "email",
					"value": email
				},
				{
					"id": "password",
					"value": password
				},
				{
					"id": "address",
					"value": address
				}
			]
	}

@dataclass 
class User: 
	email: str
	address: str

users = [
	User(email='admin@vega.com', address='Milojka lesjanina'),
	User(email='user_1@vega.com', address='nis'),
	User(email='user_2@vega.com', address='sokobanja'),
	User(email='user_3@vega.com', address='prokuplje')
]

for user in users: 
	print(f"Signing up: {user.email}")

	signup_res = None
	try:
		signup_res = post(url=signup_url, 
					headers=signup_header,
					json=get_signup_data(user.email, 
						  "defaultpwd1", 
						  user.address) )
		
		if signup_res is None or signup_res.status_code != 200: 
			print("Failed to signup.")

	except Exception as e: 
		print(f"Failed to signup: {e}")