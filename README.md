# Vega Delivery by Nemanja Milosavljevic 

This app consists of next modules: 
- Backend - Backend exposing HTTP REST API  written in python using FastAPI
- Supertokens - Authentication solution used by both frontend and backend. 
- Frontend - Web application developed using React. 

Everything can be set up by running `docker compose up` while inside the root of the project. 
This command will build and start next containers: 
- tokens-core.vega - Part of the Supertokens authentication solution, exposing HTTP REST API.
- tokens-db.vega - Postgres database used by the tokens-code.vega service. 
- backend.vega - Backend application exposing HTTP REST API for CRUD operations on chains, restaurants, couriers and menu items. Database used by the `backend.vega` service is sqlite in-file database. To keep the data after the container restart `local.db` file should be mounted as a volume using commented section inside `docker-compose.yaml` under the `backend` service configuration: 
```
	backend: 
		... 
		# uncomment next lines in docker-compose.yaml
		volumes: 
			-  ./backend/local.db:/app/local.db
```
HTTP REST API exposed by the backend service is described in `Order.Vega.postman_collection.json
` file, exported from the `Postman`.

If default parameters are used, after the startup (running `docker compose up`)  web application can be accessed in the browser on the address `http://localhost:3000`. 



