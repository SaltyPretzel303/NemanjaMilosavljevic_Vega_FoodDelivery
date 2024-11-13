from dataclasses import dataclass
import os	

# Singleton style config accessed by the get_instance method of AppConfig. 

@dataclass
class Config: 
	domain: str
	port: int

	admin_role: str
	user_role: str

	db_path: str


class AppConfig: 
	INSTANCE: Config = None 

	DEV_INSTANCE = Config(domain="localhost",
					port=8080, 
					admin_role="admin",
					user_role="user",
					db_path="./local.db")

	PROD_INSTANCE = Config(domain="vega.com",
					port=80,
					admin_role="admin",
					user_role="user", 
					db_path="local.db")

	STAGE_ENV_VAR = "APP_STAGE"
	PROD_STAGE = "prod"
	DEV_STAGE = "dev"

	@staticmethod
	def instance() -> Config: 
		if AppConfig.INSTANCE is None: 
			AppConfig.INSTANCE = AppConfig.load_config()

		return AppConfig.INSTANCE
	
	@staticmethod
	def load_config() -> Config: 
		stage = AppConfig.resolve_stage()
		print(f"Resolved app stage to: {stage}")

		# At this point we could pull the config from some external API, db ...
		# For simplicity the config is gonna be kept in the form of static
		# config but the stage can be switched using env variables (adequate for
		# docker deployment).

		if stage == AppConfig.PROD_STAGE: 
			return AppConfig.PROD_INSTANCE
		else: 
			return AppConfig.DEV_INSTANCE


	# Checks if env var is set, if not the default/dev stage is gonna be used.
	@staticmethod
	def resolve_stage() -> str: 
		if AppConfig.STAGE_ENV_VAR in os.environ: 
			return os.environ[AppConfig.STAGE_ENV_VAR]
		else: 
			return AppConfig.DEV_STAGE
		




