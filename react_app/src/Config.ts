// const DEV_BACK_DOMAIN = 'localhost:8080'
// const PROD_BACK_DOMAIN = 'backend.vega'

// const BACK_DOMAIN = DEV_BACK_DOMAIN


type configuration = {
	backendDomain: string
	myDomain: string
	// tokensBack: string
}

const config: configuration = {
	backendDomain: "localhost:8080",
	myDomain: "localhost:3000",
	// tokensBack: 'localhost:8080'
	// tokensBack: 'backend.vega'
}

export default config; 