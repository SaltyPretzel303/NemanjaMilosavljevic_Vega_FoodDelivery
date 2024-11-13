#!/usr/bin/bash

curl --request POST \
	--data '{"rootKey":"secret_key", "chain":{"chainName":"someChainName", "description":"SomeChainName description"}}' \
	--header 'Content-type: application/json'\
	http://localhost:8080/chain

