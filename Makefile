build:
	env GOOS=linux GOARCH=arm GOARM=5 go build -o ./build/clim-control
	chmod +x /build/clim-control
